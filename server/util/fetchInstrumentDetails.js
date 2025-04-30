import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name from the current module's URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fetchInstrumentDetails = async (
  stockName
) => {
  return new Promise((resolve, reject) => {
    const stream = fs
      .createReadStream(path.join(__dirname, 'NSE.csv'))
      .pipe(csv());

    stream
      .on('data', (row) => {
        if (row.tradingsymbol === stockName || row.name === stockName) {
          resolve(row);
          stream.destroy(); // Stop the stream when the data is found
        }
      })
      .on('end', () => {
        resolve(null);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

export default fetchInstrumentDetails;
