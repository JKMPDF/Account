
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="text-center bg-white dark:bg-slate-800 p-10 rounded-lg border border-slate-200 dark:border-slate-700">
      <h1 className="text-3xl font-bold text-sky-500 dark:text-sky-400 mb-4">{title}</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">This feature is under construction.</p>
      <Link to="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
};

export default PlaceholderPage;