"use client";

import { useMemo, useRef, useEffect } from 'react';
import { Flag } from 'lucide-react';
import Map, { MapRef, Source, Layer, Marker } from 'react-map-gl/mapbox';
import { useAppStore } from '../store/useAppStore';
import { interpolatePosition } from '../lib/utils';

export default function MapComponent() {
  const mapRef = useRef<MapRef>(null);
  const { activities, currentTime, appMode, segmentResults, activeSegmentId, detectedSegments, segmentRange, minTime, maxTime, theme } = useAppStore();

  useEffect(() => {
    if (activities.length > 0 && mapRef.current) {
      let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
      activities.forEach(a => {
        a.positions.forEach(p => {
          if (p.lon < minLng) minLng = p.lon;
          if (p.lon > maxLng) maxLng = p.lon;
          if (p.lat < minLat) minLat = p.lat;
          if (p.lat > maxLat) maxLat = p.lat;
        });
      });
      mapRef.current.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 50, duration: 1000 }
      );
    }
  }, [activities]);



  const handleMarkerDragEnd = (e: any, type: 'start' | 'end') => {
    if (appMode !== 'segment' || !activeSegmentId || !segmentRange || activities.length === 0) return;
    
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    
    const baseSeg = detectedSegments.find(s => s.id === activeSegmentId);
    if (!baseSeg) return;

    const ref = activities[0];
    let minDistance = Infinity;
    let closestIndex = type === 'start' ? segmentRange[0] : segmentRange[1];

    const searchStart = type === 'start' ? baseSeg.startIndex : segmentRange[0] + 1;
    const searchEnd = type === 'start' ? segmentRange[1] - 1 : baseSeg.endIndex;

    for (let i = searchStart; i <= searchEnd; i++) {
      const p = ref.positions[i];
      // Haversine approximation scaling for latitude distortion
      const latMid = (p.lat + lat) / 2 * Math.PI / 180;
      const dx = (p.lon - lng) * Math.cos(latMid);
      const dy = p.lat - lat;
      const dist = dx * dx + dy * dy;
      
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    if (type === 'start') {
      useAppStore.getState().setSegmentRange([closestIndex, segmentRange[1]]);
    } else {
      useAppStore.getState().setSegmentRange([segmentRange[0], closestIndex]);
    }
  };

  const startFinishMarkers = useMemo(() => {

    if (appMode === 'event') {
      if (activities.length === 0) return null;
      const ref = activities[0];
      let startPos = ref.positions[0];
      let endPos = ref.positions[ref.positions.length - 1];
      if (minTime !== null && maxTime !== null) {
        const sIdx = ref.positions.findIndex(p => p.time >= minTime);
        if (sIdx !== -1) startPos = ref.positions[sIdx];
        
        let eIdx = -1;
        for (let i = ref.positions.length - 1; i >= 0; i--) {
          if (ref.positions[i].time <= maxTime) {
            eIdx = i;
            break;
          }
        }
        if (eIdx !== -1) endPos = ref.positions[eIdx];
      }
      return {
        start: startPos,
        end: endPos
      };
    } else {
      if (!segmentRange || activities.length === 0) return null;
      const ref = activities[0];
      return {
        start: ref.positions[segmentRange[0]],
        end: ref.positions[segmentRange[1]]
      };
    }
  }, [appMode, activities, activeSegmentId, segmentRange]);

  const currentPositions = useMemo(() => {
    if (currentTime === null) return [];
    
    return activities.map(activity => {
      let timeToInterpolate = currentTime;

      if (appMode === 'segment') {
        const result = segmentResults.find(r => r.activityId === activity.id);
        if (!result) return { ...activity, currentPos: null };
        
        if (currentTime > result.duration) {
          timeToInterpolate = result.endTime;
        } else {
          timeToInterpolate = result.startTime + currentTime;
        }
      }

      const pos = interpolatePosition(activity.positions, timeToInterpolate);
      return {
        ...activity,
        currentPos: pos
      };
    });
  }, [activities, currentTime, appMode, segmentResults, activeSegmentId]);


  const baseSegmentPaths = useMemo(() => {
    if (appMode !== 'segment') return [];
    if (!activeSegmentId) {
      if (activities.length === 0) return [];
      const ref = activities[0];
      return [{
        id: 'base-segment-outline',
        color: '#9CA3AF',
        geojson: {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: ref.positions.map(p => [p.lon, p.lat])
          }
        }
      }];
    }
    const baseSeg = detectedSegments.find(s => s.id === activeSegmentId);
    if (!baseSeg || activities.length === 0) return [];
    
    const ref = activities[0];
    const pts = ref.positions.slice(baseSeg.startIndex, baseSeg.endIndex + 1);
    
    return [{
      id: 'base-segment-outline',
      color: '#9CA3AF',
      geojson: {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: pts.map(p => [p.lon, p.lat])
        }
      }
    }];
  }, [appMode, activeSegmentId, detectedSegments, activities]);

  const activeSegmentPaths = useMemo(() => {

    if (appMode !== 'segment' || segmentResults.length === 0) return [];
    return segmentResults.map(res => {
      const act = activities.find(a => a.id === res.activityId);
      if (!act) return null;
      const pts = act.positions.filter(p => p.time >= res.startTime && p.time <= res.endTime);
      return {
        id: act.id,
        color: act.color,
        geojson: {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: pts.map(p => [p.lon, p.lat])
          }
        }
      };
    }).filter(Boolean) as { id: string, color: string, geojson: any }[];
  }, [appMode, activeSegmentId, segmentResults, activities]);

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: activities[0]?.positions[0]?.lon || -122.4,
          latitude: activities[0]?.positions[0]?.lat || 37.8,
          zoom: 11
        }}
        mapStyle={theme === 'dark' ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        {/* Event Mode: Draw full paths */}
        {appMode === 'event' && activities.map((activity) => {
          const filteredPositions = (minTime !== null && maxTime !== null) 
            ? activity.positions.filter(p => p.time >= minTime && p.time <= maxTime)
            : activity.positions;
            
          const geojson = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: filteredPositions.map(p => [p.lon, p.lat])
            }
          };

          return (
            <Source key={`source-${activity.id}`} id={`source-${activity.id}`} type="geojson" data={geojson}>
              <Layer 
                id={`layer-${activity.id}`} 
                type="line" 
                paint={{
                  'line-color': activity.color,
                  'line-width': 3,
                  'line-opacity': 0.8
                }} 
              />
            </Source>
          );
        })}


        {/* Segment Mode: Base segment track (drop zone outline) */}
        {appMode === 'segment' && baseSegmentPaths.map((path) => (
          <Source key={`base-source-${path.id}`} id={`base-source-${path.id}`} type="geojson" data={path.geojson}>
            <Layer 
              id={`base-layer-${path.id}`} 
              type="line" 
              paint={{
                'line-color': path.color,
                'line-width': 8,
                'line-opacity': 0.4,
                'line-dasharray': [2, 2]
              }} 
            />
          </Source>
        ))}

        {/* Segment Mode: Draw only the active segment paths */}

        {appMode === 'segment' && activeSegmentPaths.map((path) => (
          <Source key={`segment-source-${path.id}`} id={`segment-source-${path.id}`} type="geojson" data={path.geojson}>
            <Layer 
              id={`segment-layer-${path.id}`} 
              type="line" 
              paint={{
                'line-color': path.color,
                'line-width': 5,
                'line-opacity': 1.0
              }} 
            />
          </Source>
        ))}

        {/* Segment Mode: Draw full paths extremely dimmed so users have context */}
        {appMode === 'segment' && activities.map((activity) => {
          const geojson = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: activity.positions.map(p => [p.lon, p.lat])
            }
          };
          return (
            <Source key={`dim-source-${activity.id}`} id={`dim-source-${activity.id}`} type="geojson" data={geojson}>
              <Layer 
                id={`dim-layer-${activity.id}`} 
                type="line" 
                paint={{
                  'line-color': '#4b5563',
                  'line-width': 1,
                  'line-opacity': 0.3
                }} 
              />
            </Source>
          );
        })}


        {/* Start / Finish Markers */}
        {startFinishMarkers && startFinishMarkers.start && (
          <Marker longitude={startFinishMarkers.start.lon} latitude={startFinishMarkers.start.lat} anchor="bottom" draggable={appMode === "segment"} onDragEnd={(e) => handleMarkerDragEnd(e, "start")}>
            <div className="flex flex-col items-center">
              <div className="bg-green-500 rounded-full p-1 shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                <Flag className="w-3 h-3 text-white" fill="currentColor" />
              </div>
              <div className="w-0.5 h-4 bg-white/50 mx-auto mt-0.5"></div>
            </div>
          </Marker>
        )}
        {startFinishMarkers && startFinishMarkers.end && (
          <Marker longitude={startFinishMarkers.end.lon} latitude={startFinishMarkers.end.lat} anchor="bottom" draggable={appMode === "segment"} onDragEnd={(e) => handleMarkerDragEnd(e, "end")}>
            <div className="flex flex-col items-center">
              <div className="text-xl drop-shadow-md leading-none cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" title="Finish Line">🏁</div>
              <div className="w-0.5 h-4 bg-white/50 mx-auto mt-0.5"></div>
            </div>
          </Marker>
        )}

        {/* Draw Current Position Markers */}
        {(appMode === 'event' || (appMode === 'segment' && activeSegmentId)) && currentPositions.map((act) => {
          if (!act.currentPos) return null;
          return (
            <Marker 
              key={`marker-${act.id}`} 
              longitude={act.currentPos.lon} 
              latitude={act.currentPos.lat}
              anchor="center"
            >
              <div 
                className={`w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-75 z-10 relative scale-125`}
                style={{ backgroundColor: act.color }}
                title={act.name}
              />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
