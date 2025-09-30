import React, { useState, useContext, useMemo } from 'react';
import { CompanyDataContext } from '../../context/CompanyDataContext';
import type { CompanyDetails, CompanyType } from '../../types';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import ToggleSwitch from '../../components/ToggleSwitch';
import { SaveIcon } from '../../components/Icon';
import { COUNTRIES } from '../../constants/countries';

const CompanyProfile: React.FC = () => {
  const context = useContext(CompanyDataContext);
  
  if (!context || !context.companyData) {
    return <div>Loading company data...</div>;
  }
  
  const { companyData, updateCompanyDetails } = context;
  const [details, setDetails] = useState<CompanyDetails>(companyData.details);
  const [errors, setErrors] = useState<{ email?: string; gstNo?: string }>({});

  const financialYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = 5; i >= -5; i--) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      const fy = `${startYear}-${endYear.toString().slice(2)}`;
      options.push({ value: fy, label: `F.Y. ${fy}` });
    }
    return options;
  }, []);

  const countryOptions = useMemo(() => COUNTRIES.map(c => ({ value: c.name, label: c.name })), []);
  const stateOptions = useMemo(() => {
    const selectedCountry = COUNTRIES.find(c => c.name === details.country);
    if (!selectedCountry) return [{ value: '', label: 'Select State' }];
    return [
      { value: '', label: 'Select State' },
      ...selectedCountry.states.map(s => ({ value: s.name, label: s.name }))
    ];
  }, [details.country]);

  const validateEmail = (email: string) => {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email format.' }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const validateGstNo = (gstNo: string) => {
    if (gstNo && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNo)) {
      setErrors(prev => ({ ...prev, gstNo: 'Invalid format. Must be a 15-character alphanumeric string.' }));
    } else {
      setErrors(prev => ({ ...prev, gstNo: undefined }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'email') validateEmail(value);
    if (name === 'gstNo') validateGstNo(value.toUpperCase());
    setDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: keyof CompanyDetails, value: string) => {
    setDetails(prev => {
        const newDetails = { ...prev, [name]: value };
        if (name === 'country') {
            newDetails.state = ''; // Reset state when country changes
        }
        return newDetails;
    });
  };

  const handleToggleChange = (name: 'gstApplicable' | 'tdsApplicable', value: boolean) => {
    setDetails(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.email || errors.gstNo) {
        alert("Please fix the errors before submitting.");
        return;
    }
    updateCompanyDetails(details);
  };
  
  const companyTypeOptions = [
      { value: "Private", label: "Private Ltd."},
      { value: "Public", label: "Public Ltd."},
      { value: "Proprietor", label: "Proprietorship"},
      { value: "LLP", label: "LLP"},
      { value: "Firm", label: "Firm"},
  ];

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Company Profile</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 {/* Left Column */}
                <div className="space-y-6">
                  <Input label="Company Name" id="name" name="name" type="text" value={details.name} onChange={handleChange} required />
                  <Textarea label="Address" id="address" name="address" value={details.address} onChange={handleChange} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Select 
                        label="Country" 
                        id="country" 
                        value={details.country} 
                        onChange={(val) => handleSelectChange('country', val)}
                        options={countryOptions}
                      />
                     <Select 
                        label="State" 
                        id="state" 
                        value={details.state} 
                        onChange={(val) => handleSelectChange('state', val)}
                        options={stateOptions}
                      />
                  </div>
                  <Input label="Pincode" id="pincode" name="pincode" type="text" value={details.pincode} onChange={handleChange} />
                   <div>
                    <Input label="Email ID" id="email" name="email" type="email" value={details.email} onChange={handleChange} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <Input label="Phone No." id="phone" name="phone" type="text" value={details.phone} onChange={handleChange} />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                   <Select 
                        label="Company Type" 
                        id="companyType" 
                        value={details.companyType} 
                        onChange={(val) => handleSelectChange('companyType', val as CompanyType)}
                        options={companyTypeOptions}
                    />
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Currency Symbol" id="currencySymbol" name="currencySymbol" type="text" value={details.currencySymbol} onChange={handleChange} />
                    <Select 
                        label="Financial Year" 
                        id="financialYear" 
                        value={details.financialYear} 
                        onChange={(val) => handleSelectChange('financialYear', val)}
                        options={financialYearOptions} 
                        required 
                    />
                   </div>
                   <Input label="Turnover in Previous Year" id="prevYearTurnover" name="prevYearTurnover" type="number" value={details.prevYearTurnover} onChange={handleChange} />
                   <div className='space-y-4'>
                    <ToggleSwitch label="GST Applicable" id="gstApplicable" enabled={details.gstApplicable} onChange={(val) => handleToggleChange('gstApplicable', val)} />
                    {details.gstApplicable && (
                        <div>
                            <Input label="GST No." id="gstNo" name="gstNo" type="text" value={details.gstNo} onChange={handleChange} placeholder="e.g. 29ABCDE1234F1Z5" />
                            {errors.gstNo && <p className="text-red-500 text-xs mt-1">{errors.gstNo}</p>}
                        </div>
                    )}
                    <ToggleSwitch label="TDS Applicable" id="tdsApplicable" enabled={details.tdsApplicable} onChange={(val) => handleToggleChange('tdsApplicable', val)} />
                   </div>
                   <Input label="PAN No." id="panNo" name="panNo" type="text" value={details.panNo || ''} onChange={handleChange} />
                   <Input label="UPI ID" id="upiId" name="upiId" type="text" value={details.upiId || ''} onChange={handleChange} placeholder="e.g. yourname@bank" />
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button type="submit">
                    <SaveIcon className="w-5 h-5 mr-2" />
                    Save Changes
                </Button>
            </div>
        </form>
    </div>
  );
};

export default CompanyProfile;