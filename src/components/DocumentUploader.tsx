'use client';

import { useRef, useState } from 'react';

const DOCUMENT_TYPES = [
  { value: 'ubd', label: 'UBD Unit (Understanding by Design)' },
  { value: 'scope_sequence', label: 'Scope & Sequence' },
  { value: 'lesson_plan', label: 'Lesson Plan' },
  { value: 'pacing_guide', label: 'Pacing Guide' },
  { value: 'curriculum_map', label: 'Curriculum Map' },
  { value: 'other', label: 'Other (describe)' },
];

interface DocumentUploaderProps {
  onParsed: (fields: Record<string, unknown>, documentType: string) => Promise<void> | void;
  hintLine?: string;
}

export default function DocumentUploader({ onParsed, hintLine }: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('ubd');
  const [customDescription, setCustomDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage('Extracting text and converting to UBD…');
    setError(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      if (documentType === 'other') formData.append('custom_description', customDescription);

      const res = await fetch('/api/docs/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(true);
        setMessage(data.error || 'Upload failed.');
        return;
      }

      await onParsed(data.fields || {}, data.document_type || documentType);
      setMessage(
        documentType === 'ubd'
          ? 'Fields populated! Review and save.'
          : 'Converted to UBD. Look for "AI-suggested:" prefixes and revise those sections before submitting.'
      );
      setTimeout(() => setMessage(''), 6000);
    } catch {
      setError(true);
      setMessage('Could not process the file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-700">Import from a document</p>
        {hintLine && <p className="text-xs text-slate-400">{hintLine}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className={documentType === 'other' ? 'md:col-span-1' : 'md:col-span-2'}>
          <label className="block text-xs font-medium text-slate-600 mb-1">What kind of document is this?</label>
          <select value={documentType} onChange={e => setDocumentType(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {documentType === 'other' && (
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Describe it</label>
            <input value={customDescription} onChange={e => setCustomDescription(e.target.value)}
              placeholder="e.g. State PD template"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <div className="md:col-span-1">
          <input ref={fileInputRef} type="file" accept=".docx,.pdf" onChange={handleFileChange} className="hidden" id="curriclio-doc-upload" />
          <label htmlFor="curriclio-doc-upload"
            className={`block text-center px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition ${
              uploading ? 'bg-slate-300 text-slate-500 cursor-wait' : 'bg-indigo-500 text-white hover:bg-indigo-400'
            }`}>
            {uploading ? 'Processing…' : 'Upload .docx or .pdf'}
          </label>
        </div>
      </div>

      {documentType !== 'ubd' && (
        <p className="text-xs text-slate-500">
          We&rsquo;ll convert it to UBD. Any field we infer will be prefixed <code className="bg-slate-100 px-1 py-0.5 rounded">AI-suggested:</code> &mdash; review those before submitting.
        </p>
      )}

      {message && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
    </div>
  );
}
