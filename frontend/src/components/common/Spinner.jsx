export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm:'w-4 h-4 border-2', md:'w-6 h-6 border-2', lg:'w-10 h-10 border-[3px]' }[size] || 'w-6 h-6 border-2';
  return (
    <div className={`${s} border-brand-500/20 border-t-brand-500 rounded-full animate-spin ${className}`}/>
  );
}
