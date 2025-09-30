/**
 * Generates a CSV file from headers and data rows and triggers a download.
 * @param headers An array of strings for the CSV header row.
 * @param data A 2D array of data, where each inner array is a row.
 * @param filename The name of the file to be downloaded (without extension).
 */
export const generateCSV = (headers: string[], data: any[][], filename: string) => {
    const csvRows = [];
    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = row.map(val => {
            const escaped = ('' + val).replace(/"/g, '""'); // Escape double quotes
            return `"${escaped}"`; // Wrap every value in double quotes
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Formats a date string or Date object into DD/MM/YYYY format.
 * @param dateString The date to format.
 * @returns A formatted date string or an empty string if the input is invalid.
 */
export const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Check for invalid date
  if (isNaN(date.getTime())) {
      return '';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Converts a number to its word representation for Indian currency.
 * @param num The number to convert.
 * @returns The number in words (e.g., "One Hundred Twenty-Three Rupees and Fifty Paisa Only").
 */
export const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
        let str = '';
        if (n > 9999999) {
            str += inWords(Math.floor(n / 10000000));
            str += 'Crore ';
            n %= 10000000;
        }
        if (n > 99999) {
            str += inWords(Math.floor(n / 100000));
            str += 'Lakh ';
            n %= 100000;
        }
        if (n > 999) {
            str += inWords(Math.floor(n / 1000));
            str += 'Thousand ';
            n %= 1000;
        }
        if (n > 99) {
            str += inWords(Math.floor(n / 100));
            str += 'Hundred ';
            n %= 100;
        }
        if (n > 19) {
            str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
        } else {
            str += a[n];
        }
        return str;
    };

    if (typeof num !== 'number') return 'Invalid Number';
    const numStr = num.toFixed(2);
    const [rupees, paisa] = numStr.split('.').map(Number);
    
    let words = '';
    if (rupees > 0) {
        words += inWords(rupees).trim() + ' Rupees';
    }

    if (paisa > 0) {
        if (rupees > 0) words += ' and ';
        words += inWords(paisa).trim() + ' Paisa';
    }

    if(words === '') return 'Zero Rupees Only';

    return words.replace(/\s+/g, ' ').trim() + ' Only';
};
