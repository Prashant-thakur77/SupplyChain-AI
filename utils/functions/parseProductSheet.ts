import Papa from 'papaparse';

/**
 * Interface for product data from the CSV file
 */
interface ProductData {
    'Product ID': string;
    'Name': string;
    'Quantity': number;
    'Price': number;
    'Category': string;
    'Weight (kg)': number;
}

/**
 * Parses a CSV product sheet into usable data
 * @param {File} file - The uploaded CSV file
 * @returns {Promise<ProductData[]>} - Array of product objects
 */
async function parseProductSheet(file: File): Promise<ProductData[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            delimiter: ",", // Explicitly set comma as delimiter
            skipEmptyLines: true, // Skip empty lines
            transformHeader: (header) => header.trim(), // Trim whitespace from headers
            complete: (results) => {
                try {
                    if (results.errors && results.errors.length > 0) {
                        reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
                        return;
                    }

                    const jsonData = results.data as ProductData[];

                    // Validate required columns
                    const requiredColumns = ['Product ID', 'Name', 'Quantity', 'Price', 'Category', 'Weight (kg)'];

                    if (jsonData.length > 0) {
                        const firstRow = jsonData[0];
                        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

                        if (missingColumns.length > 0) {
                            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
                            return;
                        }
                    }

                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(new Error(`CSV parsing error: ${error.message}`));
            }
        });
    });
}

export default parseProductSheet;