import { describe, it, expect } from 'vitest';
import { parseProductCSV, parseCSVTokens } from './csvProducts';

describe('CSV Products Parser', () => {
  it('handles quoted commas and escaped quotes correctly', () => {
    const csv = `Name,Price,Stock,Category
"Tea, Special Ginger",20,100,Beverages
"Baker's ""Premium"" Rusk",30,50,Bakery
`;
    const res = parseProductCSV(csv);
    expect(res.validRows.length).toBe(2);
    expect(res.validRows[0].name).toBe('Tea, Special Ginger');
    expect(res.validRows[0].price).toBe(20);
    expect(res.validRows[0].stock).toBe(100);
    expect(res.validRows[1].name).toBe('Baker\'s "Premium" Rusk');
    expect(res.validRows[1].price).toBe(30);
    expect(res.validRows[1].stock).toBe(50);
  });

  it('skips empty lines and whitespace lines', () => {
    const csv = `Name,Price,Stock,Category

"Chai",10,50,Beverages

   
"Coffee",20,30,Beverages

`;
    const res = parseProductCSV(csv);
    expect(res.totalRows).toBe(2);
    expect(res.validRows.length).toBe(2);
    expect(res.validRows.map(r => r.name)).toEqual(['Chai', 'Coffee']);
  });

  it('reads header row case-insensitively and maps columns in any order', () => {
    const csv = `CATEGORY,STOCK,PRICE,NAME
Snacks,25,15.5,"Samosa"
`;
    const res = parseProductCSV(csv);
    expect(res.validRows.length).toBe(1);
    const row = res.validRows[0];
    expect(row.name).toBe('Samosa');
    expect(row.price).toBe(15.5);
    expect(row.stock).toBe(25);
    expect(row.category).toBe('Snacks');
  });

  it('enforces rule: Name required', () => {
    const csv = `Name,Price,Stock,Category
,20,50,Beverages
"  ",20,50,Beverages
"Green Tea",25,40,Beverages
`;
    const res = parseProductCSV(csv);
    expect(res.totalRows).toBe(3);
    expect(res.invalidRows.length).toBe(2);
    expect(res.invalidRows[0].errors).toContain('Name is required');
    expect(res.invalidRows[1].errors).toContain('Name is required');
    expect(res.validRows.length).toBe(1);
    expect(res.validRows[0].name).toBe('Green Tea');
  });

  it('enforces rule: Price > 0', () => {
    const csv = `Name,Price,Stock,Category
"Item 1",0,10,General
"Item 2",-5,10,General
"Item 3",abc,10,General
"Item 4",,10,General
"Item 5",12.5,10,General
`;
    const res = parseProductCSV(csv);
    expect(res.invalidRows.length).toBe(4);
    expect(res.invalidRows[0].errors).toContain('Price must be greater than 0');
    expect(res.invalidRows[1].errors).toContain('Price must be greater than 0');
    expect(res.invalidRows[2].errors).toContain('Price must be greater than 0');
    expect(res.invalidRows[3].errors).toContain('Price must be greater than 0');
    expect(res.validRows.length).toBe(1);
    expect(res.validRows[0].name).toBe('Item 5');
    expect(res.validRows[0].price).toBe(12.5);
  });

  it('enforces rule: Stock must be a non-negative integer', () => {
    const csv = `Name,Price,Stock,Category
"Item A",10,-1,General
"Item B",10,5.5,General
"Item C",10,xyz,General
"Item D",10,0,General
"Item E",10,100,General
`;
    const res = parseProductCSV(csv);
    expect(res.invalidRows.length).toBe(3);
    expect(res.invalidRows[0].errors).toContain('Stock must be a non-negative integer');
    expect(res.invalidRows[1].errors).toContain('Stock must be a non-negative integer');
    expect(res.invalidRows[2].errors).toContain('Stock must be a non-negative integer');
    expect(res.validRows.length).toBe(2);
    expect(res.validRows[0].stock).toBe(0);
    expect(res.validRows[1].stock).toBe(100);
  });

  it('simulates upsert: duplicate names (case-insensitive) update price and stock while untouched products stay intact', () => {
    const existingProducts = [
      { id: '1', name: 'Chai', price: 10, stock: 50, category: 'Beverages' },
      { id: '2', name: 'Coffee', price: 20, stock: 30, category: 'Beverages' },
      { id: '3', name: 'Untouched Item', price: 99, stock: 5, category: 'Special' },
    ];

    const csv = `Name,Price,Stock,Category
"chai",12,60,Beverages
"NEW BISCUIT",25,40,Snacks
`;
    const res = parseProductCSV(csv);
    expect(res.validRows.length).toBe(2);

    // Apply import logic
    const updatedProducts = [...existingProducts];
    for (const validRow of res.validRows) {
      const matchIdx = updatedProducts.findIndex(
        p => p.name.trim().toLowerCase() === validRow.name.trim().toLowerCase()
      );
      if (matchIdx !== -1) {
        updatedProducts[matchIdx] = {
          ...updatedProducts[matchIdx],
          price: validRow.price,
          stock: validRow.stock,
          category: validRow.category || updatedProducts[matchIdx].category,
        };
      } else {
        updatedProducts.push({
          id: 'new-' + validRow.name,
          name: validRow.name,
          price: validRow.price,
          stock: validRow.stock,
          category: validRow.category,
        });
      }
    }

    // 1. Chai updated in price and stock
    const updatedChai = updatedProducts.find(p => p.name === 'Chai');
    expect(updatedChai?.price).toBe(12);
    expect(updatedChai?.stock).toBe(60);

    // 2. Untouched Item remained completely unchanged
    const untouched = updatedProducts.find(p => p.id === '3');
    expect(untouched).toEqual({ id: '3', name: 'Untouched Item', price: 99, stock: 5, category: 'Special' });

    // 3. Coffee remained unchanged
    const coffee = updatedProducts.find(p => p.id === '2');
    expect(coffee).toEqual({ id: '2', name: 'Coffee', price: 20, stock: 30, category: 'Beverages' });

    // 4. New Biscuit added
    const newBiscuit = updatedProducts.find(p => p.name === 'NEW BISCUIT');
    expect(newBiscuit).toBeDefined();
    expect(newBiscuit?.price).toBe(25);
    expect(newBiscuit?.stock).toBe(40);
  });
});
