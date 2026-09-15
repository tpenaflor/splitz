import { NextResponse } from 'next/server';

function generateColor() {
  const colors = ['#9333ea', '#db2777', '#0284c7', '#16a34a', '#ea580c', '#eab308'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const activityId = url.searchParams.get('activityId');
  const token = url.searchParams.get('token');
  const startTimeStr = url.searchParams.get('startTime');
  const name = url.searchParams.get('name') || 'Strava Activity';

  if (!activityId || !token || !startTimeStr) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const startTime = parseInt(startTimeStr, 10);

  try {
    // Fetch streams: time, latlng, altitude, heartrate, watts, cadence, velocity_smooth
    const keys = 'time,latlng,altitude,heartrate,watts,cadence,velocity_smooth';
    const stravaRes = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${keys}&key_by_type=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!stravaRes.ok) {
      const errorData = await stravaRes.json();
      console.error('Strava streams error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch streams', details: errorData }, { status: stravaRes.status });
    }

    const streams = await stravaRes.json();

    if (!streams.time || !streams.latlng) {
      return NextResponse.json({ error: 'Activity is missing GPS or time data.' }, { status: 400 });
    }

    const timeData = streams.time.data;
    const latlngData = streams.latlng.data;
    const altitudeData = streams.altitude?.data;
    const hrData = streams.heartrate?.data;
    const powerData = streams.watts?.data;
    const cadenceData = streams.cadence?.data;
    const speedData = streams.velocity_smooth?.data; // m/s

    const positions = [];

    for (let i = 0; i < timeData.length; i++) {
      const relativeTime = timeData[i];
      const absoluteTime = startTime + relativeTime;
      const latlng = latlngData[i];

      if (latlng && latlng.length === 2) {
        positions.push({
          time: absoluteTime,
          lat: latlng[0],
          lon: latlng[1],
          elevation: altitudeData ? altitudeData[i] : undefined,
          heartRate: hrData ? hrData[i] : undefined,
          power: powerData ? powerData[i] : undefined,
          cadence: cadenceData ? cadenceData[i] : undefined,
          speed: speedData ? speedData[i] : undefined,
        });
      }
    }

    if (positions.length === 0) {
      return NextResponse.json({ error: 'No valid GPS points found.' }, { status: 400 });
    }

    let profilePic: string | undefined;
    try {
      const athleteRes = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (athleteRes.ok) {
        const athlete = await athleteRes.json();
        if (athlete.profile && athlete.profile !== 'avatar/athlete/large.png') {
          profilePic = athlete.profile;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch athlete profile', e);
    }

    const activityData = {
      id: activityId,
      name,
      color: generateColor(),
      positions,
      startTime: positions[0].time,
      endTime: positions[positions.length - 1].time,
      profilePic,
    };

    return NextResponse.json({ activityData });

  } catch (error) {
    console.error('Failed to parse streams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
