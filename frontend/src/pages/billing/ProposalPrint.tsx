import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function ProposalPrint() {
    const { id } = useParams();
    const [proposal, setProposal] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/proposals/${id}`)
            .then(res => setProposal(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-10 text-center font-bold">Loading Proposal...</div>;
    if (!proposal) return <div className="p-10 text-center text-red-600 font-bold">Proposal not found</div>;

    const proposalsDate = new Date(proposal.created_at).toLocaleDateString('en-GB');
    const proposalNumber = `APBS/PROP/${String(proposal.id).padStart(4, '0')}`;

    return (
        <div className="bg-slate-200 min-h-screen py-8 flex flex-col items-center select-none">
            {/* Load Architectural Font */}
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

            {/* A4 Sheet - Template with Proper Safe Margins */}
            <div className="relative w-[210mm] min-h-[297mm] bg-white shadow-2xl overflow-hidden print:shadow-none print:m-0"
                style={{
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundImage: 'url("/template.png")',
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                }}>

                {/* 1. Logo Overlay (Top Left)
                <div className="absolute top-[20px] left-[30px] z-20">
                    <img
                        src="/arvayon-logo.png"
                        alt="ARVAYON"
                        style={{
                            height: '130px',
                            width: 'auto',
                            display: 'block',
                            clipPath: 'inset(12% 0 12% 0)'
                        }}
                    />
                </div> */}

                {/* 2. Header Detail Overlays (Positioned according to screenshot) */}
                <div className="absolute top-[135px] right-[80px] text-right font-black text-black z-20" style={{ fontSize: '10.5pt' }}>
                    <p>Date: <span className="font-bold ml-1">{proposalsDate}</span></p>
                    <p className="mt-1">Proposal No: <span className="font-bold ml-1">{proposalNumber}</span></p>
                </div>

                {/* 3. Footer Detail Overlays (SHIFTED UP and LEFT) */}
                <div className="absolute bottom-[80px] right-[110px] text-[8.5pt] font-black text-black text-right uppercase leading-tight z-30">
                    <p className="tracking-tight italic font-bold">Anthony Complex, Ramanputhur Junction, Nagercoil, Tamil Nadu. - 629001.</p>
                    <p className="mt-1 font-extrabold text-[#1a1a1a] tracking-tighter opacity-70">
                        +91 9363035048, +91 9363735048 | arvayonprobuildstudio@gmail.com
                    </p>
                </div>

                {/* 4. Content Area Overlays (Inner Padding for Safe Text-Flow) */}
                <div className="px-[30mm] pt-[65mm] pb-[45mm] text-black relative z-10" style={{ fontSize: '11pt', lineHeight: '1.5' }}>

                    {/* Centered Proposal Title */}
                    <div className="text-center mt-2 mb-16">
                        <h1 className="text-[14pt] font-black uppercase border-b-2 border-black inline-block pb-0.5 whitespace-nowrap">
                            PROPOSAL FOR ARCHITECTURAL DESIGN &<br />PROJECT MANAGEMENT SERVICES
                        </h1>
                    </div>

                    {/* From/To Addresses Overlay */}
                    <div className="flex justify-between mb-16 px-1">
                        <div className="w-[50%]">
                            <p className="font-black text-[10.5pt] mb-3 text-black uppercase border-b-2 border-[#D4AC0D] inline-block tracking-tight">SUBMITTED BY:</p>
                            <div className="space-y-0.5 text-black font-extrabold">
                                <p className="text-[12pt] font-black italic">ARVAYON PRO BUILD STUDIO</p>
                                <p className="opacity-80">Architectural & Engineering Consultancy</p>
                                <p className="opacity-80">Ramanputhur Junction, Nagercoil, Tamil Nadu</p>
                                <p className="text-blue-700 underline font-extrabold decoration-blue-500/30">arvayonprobuildstudio@gmail.com</p>
                            </div>
                        </div>
                        <div className="w-[45%] text-left">
                            <p className="font-black text-[10.5pt] mb-3 text-black uppercase border-b-2 border-[#D4AC0D] inline-block tracking-tight">SUBMITTED TO:</p>
                            <div className="space-y-2.5 font-bold text-gray-800">
                                <p>Client Name: <span className="font-black text-black ml-1 text-[11.5pt]">{proposal.client_name || 'Individual'}</span></p>
                                <p>Project Location: <span className="font-black text-black ml-1 italic">{proposal.project_location || 'Not Specified'}</span></p>
                                <p>Project Area: <span className="font-black text-black ml-1 uppercase">{proposal.project_area || 'sq.ft'}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Main Sections Overlay */}
                    <div className="space-y-12">
                        <section>
                            <h2 className="font-black text-[11.5pt] uppercase mb-4 text-black tracking-tight border-b-2 border-[#D4AC0D] inline-block">1. EXECUTIVE SUMMARY</h2>
                            <div className="font-extrabold text-gray-800 leading-relaxed text-left space-y-4">
                                <p>
                                    <span className="font-black text-black italic underline decoration-[#D4AC0D] decoration-2">ARVAYON PRO BUILD STUDIO</span> is pleased to submit this proposal for providing comprehensive Architectural Design and Project Management Consultancy (PMC) services for the proposed construction project. Our model integrates:
                                </p>
                                <ul className="list-none ml-10 space-y-2.5 font-black text-black">
                                    <li className="flex gap-4 items-center tracking-tight"><span className="w-2 h-2 rounded-full border-2 border-yellow-600"></span> Precision architectural planning</li>
                                    <li className="flex gap-4 items-center tracking-tight"><span className="w-2 h-2 rounded-full border-2 border-yellow-600"></span> Cost-optimized item-rate execution</li>
                                    <li className="flex gap-4 items-center tracking-tight"><span className="w-2 h-2 rounded-full border-2 border-yellow-600"></span> Structured project monitoring</li>
                                    <li className="flex gap-4 items-center tracking-tight"><span className="w-2 h-2 rounded-full border-2 border-yellow-600"></span> Financial and quality governance</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="font-black text-[11.5pt] uppercase mb-4 text-black tracking-tight border-b-2 border-[#D4AC0D] inline-block">2. DESIGN CODES & STANDARDS</h2>
                            <p className="font-black text-gray-900 leading-relaxed text-left border-l-4 border-gray-100 pl-4">
                                All designs will be carried out as per relevant IS Codes, standard engineering practices, and local building regulations. Structural design will be based on safe load assumptions.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            {/* Print Button UI Overlay */}
            <div className="fixed bottom-10 right-10 print:hidden z-[100]">
                <button onClick={() => window.print()} className="bg-black text-[#D4AC0D] px-12 py-5 rounded-3xl font-black text-lg shadow-2xl hover:bg-gray-900 transition-colors">
                    Save as PDF / Print
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: A4; }
                    body { -webkit-print-color-adjust: exact; padding: 0 !important; margin: 0 !important; background: white !important; }
                    html { margin: 0 !important; }
                    
                    /* Hide everything except the A4 container */
                    .print\\:hidden { display: none !important; }
                }
            ` }} />
        </div>
    );
}
