export interface ParsedProductRow {
  rowNumber: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  isValid: boolean;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedProductRow[];
  validRows: ParsedProductRow[];
  invalidRows: ParsedProductRow[];
  totalRows: number;
  headerError?: string;
}

/**
 * Parses raw CSV text handling RFC 4180 rules (quoted commas, escaped double-quotes "")
 */
export function parseCSVTokens(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Parses a product CSV string and validates each row according to the business rules:
 * - Reads header row and maps columns by name (name, price, stock, category; case-insensitive, any order)
 * - Handles quoted commas and escaped quotes ("")
 * - Skips empty lines
 * - Name required
 * - Price > 0
 * - Stock non-negative integer
 */
export function parseProductCSV(text: string): ParseResult {
  const allTokenRows = parseCSVTokens(text);
  
  // Filter out empty lines (rows where all fields are whitespace or empty)
  const nonEmptyRows: { originalIndex: number; tokens: string[] }[] = [];
  allTokenRows.forEach((row, idx) => {
    if (row.some(cell => cell.trim().length > 0)) {
      nonEmptyRows.push({ originalIndex: idx + 1, tokens: row });
    }
  });

  if (nonEmptyRows.length === 0) {
    return {
      rows: [],
      validRows: [],
      invalidRows: [],
      totalRows: 0,
      headerError: 'CSV file is empty'
    };
  }

  // Header row mapping
  const headerTokens = nonEmptyRows[0].tokens.map(h => h.trim().toLowerCase());
  const nameIndex = headerTokens.findIndex(h => h === 'name' || h === 'product name' || h === 'item');
  const priceIndex = headerTokens.findIndex(h => h === 'price' || h === 'rate' || h === 'mrp');
  const stockIndex = headerTokens.findIndex(h => h === 'stock' || h === 'quantity' || h === 'qty');
  const categoryIndex = headerTokens.findIndex(h => h === 'category');

  if (nameIndex === -1 || priceIndex === -1 || stockIndex === -1) {
    const missing: string[] = [];
    if (nameIndex === -1) missing.push('name');
    if (priceIndex === -1) missing.push('price');
    if (stockIndex === -1) missing.push('stock');
    return {
      rows: [],
      validRows: [],
      invalidRows: [],
      totalRows: 0,
      headerError: `Missing required header column(s): ${missing.join(', ')}`
    };
  }

  const rows: ParsedProductRow[] = [];

  for (let r = 1; r < nonEmptyRows.length; r++) {
    const { originalIndex, tokens } = nonEmptyRows[r];
    const errors: string[] = [];

    const rawName = tokens[nameIndex]?.trim() || '';
    const rawPrice = tokens[priceIndex]?.trim() || '';
    const rawStock = tokens[stockIndex]?.trim() || '';
    const rawCategory = categoryIndex !== -1 ? (tokens[categoryIndex]?.trim() || 'General') : 'General';

    // 1. Name required
    if (!rawName) {
      errors.push('Name is required');
    }

    // 2. Price > 0
    const priceNum = Number(rawPrice);
    if (rawPrice === '' || isNaN(priceNum) || priceNum <= 0) {
      errors.push('Price must be greater than 0');
    }

    // 3. Stock non-negative integer
    const stockNum = Number(rawStock);
    if (rawStock === '' || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      errors.push('Stock must be a non-negative integer');
    }

    const isValid = errors.length === 0;

    rows.push({
      rowNumber: originalIndex,
      name: rawName,
      price: isValid ? priceNum : (isNaN(priceNum) ? 0 : priceNum),
      stock: isValid ? stockNum : (isNaN(stockNum) ? 0 : stockNum),
      category: rawCategory,
      isValid,
      errors
    });
  }

  const validRows = rows.filter(r => r.isValid);
  const invalidRows = rows.filter(r => !r.isValid);

  return {
    rows,
    validRows,
    invalidRows,
    totalRows: rows.length
  };
}

export const PRODUCT_CSV_TEMPLATE = `Name,Price,Stock,Category
"Chai (Tea)",15,100,Beverages
"Marie Biscuit",10,50,Snacks
"Milk, 500ml",27,30,Dairy
"Baker's ""Special"" Rusk",25,40,Bakery
`;
