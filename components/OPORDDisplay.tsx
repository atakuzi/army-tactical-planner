
import React from 'react';

interface OPORDDisplayProps {
  opord: {
    situation: string;
    mission: string;
    execution: string;
    sustainment: string;
    commandAndSignal: string;
  };
}

const OPORDDisplay: React.FC<OPORDDisplayProps> = ({ opord }) => {
  const sections = [
    { title: '1. SITUATION', content: opord.situation },
    { title: '2. MISSION', content: opord.mission },
    { title: '3. EXECUTION', content: opord.execution },
    { title: '4. SUSTAINMENT', content: opord.sustainment },
    { title: '5. COMMAND AND SIGNAL', content: opord.commandAndSignal },
  ];

  const handlePrint = () => {
    window.print();
  };

  const dtg = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '').slice(2, 10) + 'Z';

  return (
    <div className="bg-slate-950 p-2 sm:p-4 md:p-8 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="max-w-4xl mx-auto mb-4 md:mb-6 flex justify-end print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM7 11a1 1 0 100-2 1 1 0 000 2zm1 4v-1a1 1 0 011-1h2a1 1 0 011 1v1H8z" clipRule="evenodd" />
          </svg>
          <span>Export PDF</span>
        </button>
      </div>

      <div className="bg-white text-black p-6 sm:p-10 md:p-16 shadow-2xl rounded-sm print:shadow-none print:p-0 print:m-0 min-h-[11in] relative mx-auto w-full max-w-full overflow-x-auto">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            @page { margin: 1in; }
            .print-header { display: block !important; }
            .print-footer { display: block !important; }
          }
        `}} />

        <div className="hidden print:block text-center font-bold text-green-700 text-base md:text-lg mb-8 uppercase tracking-widest border-y border-green-700 py-1">
          UNCLASSIFIED
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 md:mb-12 border-b-2 border-black pb-4 md:pb-6 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase leading-none">OPERATIONS ORDER</h1>
            <p className="text-[10px] font-mono font-bold text-gray-600 uppercase">Ref: ARMY-PLANNER-MDMP-{dtg}</p>
          </div>
          <div className="text-left sm:text-right text-[9px] md:text-xs font-mono space-y-1 uppercase">
            <p className="font-bold">Copy <span className="border-b border-black px-2 md:px-4">01</span> of 01</p>
            <p>HQ: <span className="italic">[UNIT]</span></p>
            <p>DTG: {dtg}</p>
          </div>
        </div>

        <div className="space-y-8 md:space-y-12">
          {sections.map((section, idx) => (
            <section key={idx} className="break-inside-avoid">
              <h2 className="text-base md:text-xl font-black border-b border-gray-400 pb-1 md:pb-2 mb-3 md:mb-4 uppercase tracking-tight flex items-center">
                <span className="bg-black text-white px-1.5 md:px-2 mr-2 md:mr-3 text-xs md:text-sm">{idx + 1}</span>
                {section.title.split('. ')[1] || section.title}
              </h2>
              <div className="text-[12px] md:text-[14px] leading-relaxed whitespace-pre-wrap font-serif pl-4 md:pl-8 text-justify">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 md:mt-20 flex justify-end">
          <div className="w-48 md:w-64 border-t border-black pt-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest">Authorized By</p>
            <div className="h-8 md:h-12"></div>
            <p className="text-xs md:text-sm font-bold uppercase">[COMMANDER]</p>
            <p className="text-[10px] uppercase">Commanding</p>
          </div>
        </div>

        <div className="mt-16 md:mt-24 pt-4 md:pt-8 border-t border-gray-200 text-center text-[8px] md:text-[9px] text-gray-400 font-mono uppercase print:hidden">
          Army Tactical Planner // Gemini 3 Pro // FM 6-0
        </div>

        <div className="hidden print:block absolute bottom-0 left-0 right-0 text-center font-bold text-green-700 text-base md:text-lg mt-8 uppercase tracking-widest border-y border-green-700 py-1">
          UNCLASSIFIED
        </div>
      </div>
    </div>
  );
};

export default OPORDDisplay;
