
import React from 'react';

const DownloadSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Download Location</h2>
      
      <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500 rounded-r-lg">
        <h3 className="font-semibold text-sky-800 dark:text-sky-300">How Download Locations Work on the Web</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          For your security, web applications like this one cannot directly choose where files are saved on your computer. Your web browser is in full control of the download process.
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          You can configure your browser to ask you where to save each file, giving you complete control over the download path for PDFs, JSON backups, and other exports.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">How to Enable "Ask Where to Save"</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
          Follow these steps for your browser to choose a download location every time.
        </p>
        
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">Google Chrome</h4>
            <ol className="list-decimal list-inside mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Go to <code className="bg-slate-100 dark:bg-slate-700 p-1 rounded">Settings</code> &gt; <code className="bg-slate-100 dark:bg-slate-700 p-1 rounded">Downloads</code>.</li>
              <li>Turn on the toggle for <strong className="text-slate-700 dark:text-slate-300">"Ask where to save each file before downloading"</strong>.</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">Mozilla Firefox</h4>
            <ol className="list-decimal list-inside mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Go to <code className="bg-slate-100 dark:bg-slate-700 p-1 rounded">Settings</code> &gt; <code className="bg-slate-100 dark:bg-slate-700 p-1 rounded">General</code>.</li>
              <li>Scroll down to the <strong className="text-slate-700 dark:text-slate-300">"Files and Applications"</strong> section.</li>
              <li>Select the option for <strong className="text-slate-700 dark:text-slate-300">"Always ask you where to save files"</strong>.</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">Microsoft Edge</h4>
            <ol className="list-decimal list-inside mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Go to <code className="bg-slate-100 dark:bg-slate-700 p-1 rounded">Settings</code> &gt; <code className="bg-slate-100 dark:bg-slate-700 p-1 rounded">Downloads</code>.</li>
              <li>Turn on the toggle for <strong className="text-slate-700 dark:text-slate-300">"Ask me what to do with each download"</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadSettings;
