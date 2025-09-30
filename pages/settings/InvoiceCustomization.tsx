import React, { useState, useContext, useRef } from 'react';
import { CompanyDataContext } from '../../context/CompanyDataContext';
import type { InvoiceCustomization as InvoiceCustomizationType } from '../../types';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import { SaveIcon, UploadIcon } from '../../components/Icon';
import { useNotifications } from '../../context/NotificationContext';

const InvoiceCustomization: React.FC = () => {
  const context = useContext(CompanyDataContext);
  if (!context || !context.companyData) return null;
  const { addNotification } = useNotifications();

  const { companyData, updateInvoiceCustomization } = context;
  const [customization, setCustomization] = useState<InvoiceCustomizationType>(
    companyData.invoiceCustomization || { logo: '', terms: '' }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTermsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomization(prev => ({ ...prev, terms: e.target.value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 200 * 1024) { // 200KB limit
        addNotification("Image size should not exceed 200KB.", 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomization(prev => ({ ...prev, logo: reader.result as string }));
        addNotification("Logo uploaded. Remember to save changes.", 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceCustomization(customization);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Invoice Customization</h2>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Company Logo</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center">
              {customization.logo ? (
                <img src={customization.logo} alt="Company Logo" className="object-contain max-w-full max-h-full" />
              ) : (
                <span className="text-xs text-slate-500">No Logo</span>
              )}
            </div>
            <div>
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon className="w-5 h-5 mr-2" /> Upload Logo
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/png, image/jpeg" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Recommended: PNG or JPG, max 200KB.</p>
                {customization.logo && (
                    <Button type="button" variant="secondary" className="!text-red-500 mt-2 !bg-red-500/10" onClick={() => setCustomization(prev => ({...prev, logo: ''}))}>
                        Remove Logo
                    </Button>
                )}
            </div>
          </div>
        </div>
        <div>
          <Textarea 
            label="Terms & Conditions"
            id="terms"
            name="terms"
            value={customization.terms || ''}
            onChange={handleTermsChange}
            rows={5}
            placeholder="Enter your invoice terms and conditions, payment details, etc."
          />
        </div>
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="submit">
                <SaveIcon className="w-5 h-5 mr-2" />
                Save Customization
            </Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCustomization;