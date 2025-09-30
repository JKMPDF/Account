export interface State {
  name: string;
}

export interface Country {
  name: string;
  states: State[];
}

export const COUNTRIES: Country[] = [
  {
    name: 'India',
    states: [
      { name: 'Andaman and Nicobar Islands' },
      { name: 'Andhra Pradesh' },
      { name: 'Arunachal Pradesh' },
      { name: 'Assam' },
      { name: 'Bihar' },
      { name: 'Chandigarh' },
      { name: 'Chhattisgarh' },
      { name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { name: 'Delhi' },
      { name: 'Goa' },
      { name: 'Gujarat' },
      { name: 'Haryana' },
      { name: 'Himachal Pradesh' },
      { name: 'Jammu and Kashmir' },
      { name: 'Jharkhand' },
      { name: 'Karnataka' },
      { name: 'Kerala' },
      { name: 'Ladakh' },
      { name: 'Lakshadweep' },
      { name: 'Madhya Pradesh' },
      { name: 'Maharashtra' },
      { name: 'Manipur' },
      { name: 'Meghalaya' },
      { name: 'Mizoram' },
      { name: 'Nagaland' },
      { name: 'Odisha' },
      { name: 'Puducherry' },
      { name: 'Punjab' },
      { name: 'Rajasthan' },
      { name: 'Sikkim' },
      { name: 'Tamil Nadu' },
      { name: 'Telangana' },
      { name: 'Tripura' },
      { name: 'Uttar Pradesh' },
      { name: 'Uttarakhand' },
      { name: 'West Bengal' },
    ],
  },
  {
    name: 'United States',
    states: [
      { name: 'Alabama' }, { name: 'Alaska' }, { name: 'Arizona' }, { name: 'Arkansas' }, { name: 'California' }, { name: 'Colorado' }, { name: 'Connecticut' }, { name: 'Delaware' }, { name: 'Florida' }, { name: 'Georgia' }, { name: 'Hawaii' }, { name: 'Idaho' }, { name: 'Illinois' }, { name: 'Indiana' }, { name: 'Iowa' }, { name: 'Kansas' }, { name: 'Kentucky' }, { name: 'Louisiana' }, { name: 'Maine' }, { name: 'Maryland' }, { name: 'Massachusetts' }, { name: 'Michigan' }, { name: 'Minnesota' }, { name: 'Mississippi' }, { name: 'Missouri' }, { name: 'Montana' }, { name: 'Nebraska' }, { name: 'Nevada' }, { name: 'New Hampshire' }, { name: 'New Jersey' }, { name: 'New Mexico' }, { name: 'New York' }, { name: 'North Carolina' }, { name: 'North Dakota' }, { name: 'Ohio' }, { name: 'Oklahoma' }, { name: 'Oregon' }, { name: 'Pennsylvania' }, { name: 'Rhode Island' }, { name: 'South Carolina' }, { name: 'South Dakota' }, { name: 'Tennessee' }, { name: 'Texas' }, { name: 'Utah' }, { name: 'Vermont' }, { name: 'Virginia' }, { name: 'Washington' }, { name: 'West Virginia' }, { name: 'Wisconsin' }, { name: 'Wyoming' },
    ],
  },
  {
    name: 'Canada',
    states: [
      { name: 'Alberta' }, { name: 'British Columbia' }, { name: 'Manitoba' }, { name: 'New Brunswick' }, { name: 'Newfoundland and Labrador' }, { name: 'Nova Scotia' }, { name: 'Ontario' }, { name: 'Prince Edward Island' }, { name: 'Quebec' }, { name: 'Saskatchewan' },
    ],
  },
];
