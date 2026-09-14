const fs = require('fs');
const FitParser = require('fit-file-parser').default;

const buffer = fs.readFileSync('test_files/SFU A.fit');
const fitParser = new FitParser({
  force: true, speedUnit: 'm/s', lengthUnit: 'm', temperatureUnit: 'celsius', elapsedRecordField: true, mode: 'both'
});

fitParser.parse(buffer, (err, data) => {
  if (err) throw err;
  console.log("Record keys for first 5 records:");
  for (let i = 0; i < 5; i++) {
    console.log(data.records[i]);
  }
});
