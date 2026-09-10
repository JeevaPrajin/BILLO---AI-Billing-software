import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { settingsDB, productsDB, customersDB, salesDB } from '../store/db';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppContext();
  const [shopName, setShopName] = useState(settings.shopName);
  const [upiId, setUpiId] = useState(settings.upiId);
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [staffMembers, setStaffMembers] = useState<string[]>(settings.staffMembers || []);
  const [newStaff, setNewStaff] = useState('');

  const handleReset = async () => {
    if (window.confirm("Are you absolute sure you want to erase all data? This cannot be undone.")) {
      await settingsDB.clear();
      await productsDB.clear();
      await customersDB.clear();
      await salesDB.clear();
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleSave = async () => {
    await updateSettings({ shopName, upiId, phone, address, staffMembers });
    alert('Settings saved!');
  };

  const addStaff = () => {
    if (newStaff.trim() && !staffMembers.includes(newStaff.trim())) {
      setStaffMembers([...staffMembers, newStaff.trim()]);
      setNewStaff('');
    }
  };

  const removeStaff = (name: string) => {
    setStaffMembers(staffMembers.filter(s => s !== name));
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm flex items-center px-screen-margin-mobile py-space-sm h-16 gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-md font-headline-md text-primary">Shop Profile</h1>
      </header>

      <main className="p-screen-margin-mobile space-y-space-md">
        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">Shop Name</label>
          <input 
            type="text" 
            value={shopName} 
            onChange={e => setShopName(e.target.value)}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-headline-sm focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">Shop Phone</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">Shop Address</label>
          <textarea 
            value={address} 
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, Market Area"
            rows={2}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none resize-none"
          ></textarea>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">UPI ID for Payments</label>
          <input 
            type="text" 
            value={upiId} 
            onChange={e => setUpiId(e.target.value)}
            placeholder="e.g. 9876543210@ybl"
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <h3 className="text-label-md text-primary mb-2">Staff Members</h3>
          <ul className="space-y-2 mb-3">
            {staffMembers.map(staff => (
              <li key={staff} className="flex justify-between items-center bg-surface-container-low p-2 rounded-lg border border-outline-variant">
                <span className="font-body-md text-primary">{staff}</span>
                <button onClick={() => removeStaff(staff)} className="text-error flex items-center justify-center w-8 h-8 rounded-md active:bg-error-container">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newStaff} 
              onChange={e => setNewStaff(e.target.value)}
              placeholder="Staff Name"
              className="flex-1 p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
            />
            <button onClick={addStaff} className="bg-secondary-container text-on-secondary-fixed px-4 rounded-lg font-bold">Add</button>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-label-lg text-primary">Offline Mode</h3>
            <p className="text-body-sm text-on-surface-variant">App works 100% offline</p>
          </div>
          <span className="material-symbols-outlined text-tertiary-container bg-tertiary-fixed-dim rounded-full p-1">wifi_off</span>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-lg font-bold active:scale-95 transition-transform mt-4 mb-8"
        >
          Save Changes
        </button>

        <div className="bg-error-container rounded-xl p-space-md border border-error shadow-sm mt-8">
          <div className="flex items-center gap-2 mb-2 text-error">
            <span className="material-symbols-outlined">warning</span>
            <h3 className="font-label-lg font-bold">Danger Zone</h3>
          </div>
          <p className="text-body-sm text-error mb-4">
            This will permanently delete all sales, products, and customer data and reset the app to its initial state. This action cannot be undone.
          </p>
          <button 
            onClick={handleReset}
            className="w-full bg-error text-on-error py-3 rounded-xl font-label-lg font-bold active:scale-95 transition-transform"
          >
            Factory Reset App
          </button>
        </div>
      </main>
    </div>
  );
}
