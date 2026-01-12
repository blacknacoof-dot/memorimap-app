import React, { useState, useRef, useEffect } from 'react';
import { Facility } from '../../types';
import { sendMessageToGemini, ChatMessage, ActionType } from '../../services/geminiService';
import { MessageCircle, X, Send, MapPin, Phone, CalendarCheck, Loader2, Bot, Sparkles, ChevronLeft, Users, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PetChatInterface } from '../Consultation/PetChatInterface';

interface Props {
    facility: Facility;
    allFacilities?: Facility[];
    onAction: (action: ActionType) => void;
    onClose: () => void;
    currentUser: any;
    initialIntent?: 'funeral_home' | 'memorial_facility' | 'pet_funeral' | 'general' | null;
    onSearchFacilities?: (region: string) => Facility[];
    onSwitchToFacility?: (facility: Facility) => void;
    onNavigateToFacility?: (facility: Facility) => void;
}



interface FormProps {
    onSubmit: (text: string) => void;
}

const FuneralRequestForm: React.FC<FormProps> = ({ onSubmit }) => {
    const [step, setStep] = useState(1);
    const [region, setRegion] = useState('');
    const [guestCount, setGuestCount] = useState('');
    const [priorities, setPriorities] = useState<string[]>([]);
    const [error, setError] = useState('');

    const GUEST_OPTIONS = ['50紐?誘몃쭔', '100紐?, '200紐?, '300紐??댁긽'];
    const PRIORITY_OPTIONS = ['?꾩튂', '?쒖꽕', '二쇱감', '鍮꾩슜', '?쒕퉬??];

    const handleNext = () => {
        if (step === 1) {
            const validSuffixes = ['??, '??, '硫?, '媛', '由?, '濡?, '湲?, '援?, '援?, '??];
            const hasValidSuffix = validSuffixes.some(suffix => region.includes(suffix));

            if (region.length < 2 || !hasValidSuffix) {
                setError('?뺥솗??踰뺤젙???먮뒗 ?꾨줈紐낆쓣 ?낅젰??二쇱꽭?? (?? ?좎큿?? ??궪濡?');
                return;
            }
        }
        if (step === 2 && !guestCount) {
            setError('?덉긽 議곕Ц媛??섎? ?좏깮??二쇱꽭??');
            return;
        }
        setError('');
        setStep(prev => prev + 1);
    };

    const handleSubmit = () => {
        if (priorities.length === 0) {
            setError('?섎굹 ?댁긽???곗꽑?쒖쐞瑜??좏깮??二쇱꽭??');
            return;
        }
        const finalText = `?щ쭩 吏?? ${region}, ?덉긽 議곕Ц媛? ${guestCount}, ?곗꽑?쒖쐞: ${priorities.join(', ')}`;
        onSubmit(finalText);
    };

    const togglePriority = (option: string) => {
        setPriorities(prev =>
            prev.includes(option) ? prev.filter(p => p !== option) : [...prev, option]
        );
        setError('');
    };

    return (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 w-full animate-in fade-in zoom-in-95 duration-300">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4 px-1">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Region */}
            {step === 1 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin size={14} className="text-indigo-600" />
                        ?щ쭩 吏??쓣 ?뚮젮二쇱꽭??                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={region}
                            onChange={(e) => { setRegion(e.target.value); setError(''); }}
                            placeholder="?? ?쒖슱 ?좎큿?? 遺?곗쭊援?
                            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        />
                    </div>
                    <p className="text-[10px] text-slate-400">???⑥쐞源뚯? ?낅젰?섏떆硫????뺥솗?⑸땲??</p>
                </div>
            )}

            {/* Step 2: Guest Count */}
            {step === 2 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-600" />
                        ?덉긽 議곕Ц媛??섎뒗 ?대뒓 ?뺣룄?멸???
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {GUEST_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => { setGuestCount(opt); setError(''); }}
                                className={`py-2 px-3 text-sm rounded-lg border transition-all ${guestCount === opt
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Priorities */}
            {step === 3 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Star size={14} className="text-indigo-600" />
                        媛??以묒슂???곗꽑?쒖쐞?? (以묐났 媛??
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRIORITY_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => togglePriority(opt)}
                                className={`py-1.5 px-3 text-sm rounded-full border transition-all ${priorities.includes(opt)
                                    ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md transform scale-105'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-3 flex items-center gap-1.5 text-red-500 text-xs animate-pulse">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-4 flex gap-2">
                {step > 1 && (
                    <button
                        onClick={() => setStep(prev => prev - 1)}
                        className="px-3 py-2 text-slate-500 text-xs hover:bg-slate-100 rounded-lg transition"
                    >
                        ?댁쟾
                    </button>
                )}
                <button
                    onClick={step === 3 ? handleSubmit : handleNext}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                    {step === 3 ? <><CheckCircle2 size={16} /> ?꾨즺</> : '?ㅼ쓬'}
                </button>
            </div>
        </div>
    );
};

export const ChatInterface: React.FC<Props> = ({ facility, allFacilities = [], onAction, onClose, currentUser, initialIntent, onSwitchToFacility, onNavigateToFacility }) => {

    const isPetFacility = facility.type === 'pet' || initialIntent === 'pet_funeral';

    if (isPetFacility && facility.id !== 'maum-i') {
        return <PetChatInterface
            company={facility as any}
            onClose={onClose}
            onBack={onClose}
        />;
    }

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendedCandidates, setRecommendedCandidates] = useState<Facility[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // FAQ Chips (Dynamic based on facility type)
    const FAQ_LIST_FUNERAL = [
        { icon: "?뱧", label: "???꾩튂 二쇰?", question: "??二쇰??먯꽌 媛??媛源뚯슫 ?λ??앹옣??李얠븘二쇱꽭??" },
        { icon: "?뫅?랅윉⒱랅윉㎮랅윉?, label: "媛議깆옣(?뚭퇋紐?", question: "議곕Ц媛?50紐?誘몃쭔???뚭퇋紐?媛議깆옣 ?λ??앹옣??異붿쿇??二쇱꽭??" },
        { icon: "?룫", label: "??숇퀝??, question: "??숇퀝???λ??앹옣 ?꾩＜濡?蹂댁뿬二쇱꽭??" },
        { icon: "?뮥", label: "鍮꾩슜 ?곗꽑", question: "媛寃⑹씠 ?⑸━?곸씠怨???댄븳 ?λ??앹옣??李얠븘二쇱꽭??" },
        { icon: "?끏截?, label: "二쇱감 ?몃━", question: "二쇱감媛 ?몃━???λ??앹옣 ?꾩＜濡?異붿쿇??二쇱꽭??" },
    ];

    const FAQ_LIST_PET = [
        { icon: "?슅", label: "?쎌뾽 ?쒕퉬??媛??, question: "?쎌뾽 ?쒕퉬?ㅺ? 媛?ν븳 怨녹쓣 李얠븘二쇱꽭??" },
        { icon: "?뙔", label: "24?쒓컙 ?λ?", question: "24?쒓컙 ?댁쁺?섎뒗 諛섎젮?숇Ъ ?λ??앹옣??李얘퀬 ?덉뼱??" },
        { icon: "?뭿", label: "硫붾え由ъ뼹 ?ㅽ넠", question: "硫붾え由ъ뼹 ?ㅽ넠 ?쒖옉??媛?ν븳 怨녹씤媛??" },
        { icon: "?맯", label: "媛뺤븘吏 ?λ?", question: "媛뺤븘吏 ?λ? ?덉감? 鍮꾩슜???뚮젮二쇱꽭??" },
        { icon: "?맩", label: "怨좎뼇???λ?", question: "怨좎뼇???λ? ?꾨Ц ?쒖꽕??異붿쿇?댁＜?몄슂." },
    ];

    const FAQ_LIST_MEMORIAL = [
        { icon: "?룢截?, label: "?ㅻ궡 遊됱븞??, question: "?ㅻ궡 遊됱븞???쒖꽕??異붿쿇??二쇱꽭??" },
        { icon: "?뙰", label: "?먯뿰 ???섎ぉ??, question: "?먯뿰 移쒗솕?곸씤 ?섎ぉ?μ쓣 李얘퀬 ?덉뒿?덈떎." },
        { icon: "?앾툘", label: "湲곕룆援?泥쒖＜援??꾩슜", question: "湲곕룆援??덉떇??媛?ν븳 異붾え?쒖꽕???뚮젮二쇱꽭??" },
        { icon: "?몌툘", label: "遺덇탳 ?꾩슜", question: "遺덇탳 ?꾩슜 ?⑷낏?뱀씠??異붾え怨듭썝??李얠븘二쇱꽭??" },
        { icon: "?뭿", label: "媛寃?鍮꾧탳?섍린", question: "二쇰? ?쒖꽕?ㅼ쓽 媛寃⑹쓣 鍮꾧탳??二쇱꽭??" },
    ];

    const FAQ_LIST_CONCIERGE = [
        { icon: "?룫", label: "?λ??앹옣 李얘린", question: "?λ??앹옣??李얘퀬 ?덉뒿?덈떎." }, // Trigger Scenario A
        { icon: "?뙯", label: "異붾え?쒖꽕 李얘린", question: "?⑷낏?뱀씠???섎ぉ?μ쓣 李얘퀬 ?덉뒿?덈떎." }, // Trigger Scenario B
        { icon: "?맯", label: "?숇Ъ?λ? 李얘린", question: "諛섎젮?숇Ъ ?λ??앹옣??李얘퀬 ?덉뒿?덈떎." }, // Trigger Scenario C
        { icon: "?뱸", label: "?곷떞???곌껐", question: "?곷떞?먭낵 吏곸젒 ?듯솕?섍퀬 ?띠뒿?덈떎." }, // Trigger Scenario F
    ];

    const activeFaqList = isPetFacility
        ? FAQ_LIST_PET
        : (initialIntent === 'memorial_facility' ? FAQ_LIST_MEMORIAL :
            (initialIntent === 'funeral_home' ? FAQ_LIST_FUNERAL :
                (initialIntent ? FAQ_LIST_CONCIERGE : (facility.type === 'funeral' ? FAQ_LIST_FUNERAL : FAQ_LIST_CONCIERGE))));

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            // Determine welcome message based on facility type
            const isFuneralHome = facility.type === 'funeral';
            const userName = currentUser?.name || '怨좉컼';

            let defaultWelcome = ``;

            if (initialIntent) {
                if (initialIntent === 'funeral_home') {
                    // Scenario A: Funeral Home Form (Detected Intent)
                    // Trigger Form A immediately
                    defaultWelcome = `媛묒옉?ㅻ윭???뚯떇??留덉쓬??臾닿굅?곗떆寃좎뒿?덈떎. 怨좎씤怨??좎”遺꾨뱾?먭쾶 媛???몄븞???λ??앹옣??鍮좊Ⅴ寃?李얠븘?쒕━寃좎뒿?덈떎.\n\n?꾨옒 ?묒떇???묒꽦??二쇱떆硫?議곌굔????留욌뒗 ?λ??앹옣??異붿쿇???쒕┰?덈떎.`;
                    setMessages([{
                        role: 'model',
                        text: defaultWelcome,
                        timestamp: new Date(),
                        action: 'SHOW_FORM_A'
                    }]);
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return; // Skip default setMessages below
                } else if (initialIntent === 'memorial_facility') {
                    // Scenario B: Memorial Facility Form
                    defaultWelcome = `怨좎씤???곸썝??湲곗뼲?????덈뒗 ?됱삩???덉떇泥섎? 李얘퀬 怨꾩떊媛??\n?먰븯?쒕뒗 ?λ쵖 ?뺥깭??吏??씠 ?덉쑝?쒕떎硫?留먯???二쇱꽭?? 留덉쓬(Maeum)???щ챸??媛寃??뺣낫濡??덈궡???쒕┰?덈떎.\n\n1. **?щ쭩 吏??* (?? 寃쎄린 ?⑹씤)\n2. **?λ쵖 ?뺥깭** (?? 遊됱븞?? ?섎ぉ??\n3. **?덉궛 踰붿쐞** (?? 1,000留????댄븯)`;
                } else if (initialIntent === 'pet_funeral') {
                    // Scenario C: Pet Funeral Form
                    defaultWelcome = `?щ옉?섎뒗 ?꾩씠????대퀎, ?쇰쭏??媛???꾪봽?ㅼ? 吏먯옉??媛묐땲?? ?꾩씠媛 臾댁?媛쒕떎由щ? ?몄븞??嫄대꼸 ???덈룄濡? 誘우쓣 ???덈뒗 ?λ??앹옣???덈궡???쒕┫源뚯슂?\n\n1. **?щ쭩 吏??* (?? ?쒖슱 留덊룷援?\n2. **?꾩씠 ?뺣낫** (?? 媛뺤븘吏/5kg)\n3. **?꾩슂 ?쒕퉬??* (?? ?쎌뾽, ?ㅽ넠?쒖옉)`;
                } else {
                    defaultWelcome = `諛섍컩?듬땲?? ${userName}?? **AI 留덉쓬??*?낅땲??\n臾댁뾿???꾩??쒕┫源뚯슂?\n\n?꾨옒 踰꾪듉???뚮윭 ?먰븯?쒕뒗 ?쒕퉬?ㅻ? ?좏깮??二쇱꽭??`;
                }
            } else if (isPetFacility) {
                // Scenario C-like for specific facility
                defaultWelcome = `?덈뀞?섏꽭?? **${facility.name}** 諛섎젮?숇Ъ ?λ?吏?꾩궗?낅땲??\n?뚯쨷???꾩씠????대퀎???꾩??쒕━寃좎뒿?덈떎. \n李⑤텇?섍퀬 ?꾨쫫?ㅼ슫 ?대퀎???꾪빐 臾댁뾿?대뱺 臾쇱뼱蹂댁꽭??`;
            } else if (isFuneralHome) {
                // Scenario A-like for specific facility
                defaultWelcome = `?꾪솕二쇱뀛??媛먯궗?⑸땲?? **${facility.name}**?낅땲?? \n鍮덉냼 ?꾪솴?대굹 媛寃???沅곴툑?섏떊 ?먯쓣 留먯???二쇱꽭??`;
            } else {
                // Scenario B-like for specific facility
                defaultWelcome = `?덈뀞?섏꽭?? **${facility.name}**?낅땲?? \n怨좎씤???꾪븳 ?됱삩???덉떇泥섎? 李얠쑝?쒕굹?? ?쒖꽕 ?꾩튂??媛寃???臾댁뾿?대뱺 臾쇱뼱蹂댁꽭??`;
            }

            setMessages([{
                role: 'model',
                text: facility.ai_welcome_message || defaultWelcome,
                timestamp: new Date(),
                action: 'NONE'
            }]);

            // Auto-focus input on open
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [facility, isPetFacility, initialIntent, currentUser]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : input;
        if (!textToSend.trim() || isLoading) return;

        if (!textOverride) setInput('');

        const userMsg: ChatMessage = {
            role: 'user',
            text: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await sendMessageToGemini(textToSend, messages, facility);

            const aiMsg: ChatMessage = {
                role: 'model',
                text: response.text,
                timestamp: new Date(),
                action: response.action
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden shadow-inner">

            {/* Header Area */}
            <div className={`bg-slate-900 text-white p-5 pt-6 shadow-md z-10 shrink-0`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-slate-500/30 overflow-hidden bg-slate-700`}>
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{facility.name}</h1>
                            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                {facility.type === 'funeral' ? 'AI ?섏쟾 留ㅻ땲?' : 'AI 異붾え ?곷떞??}
                            </p>
                        </div>
                    </div>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        title="?곷떞 醫낅즺"
                    >
                        <X className="w-5 h-5 text-slate-300 hover:text-white" />
                    </button>
                </div>

                {/* Quick Info Badges & Direct Action */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 text-[11px] font-medium">
                        <span className={`bg-slate-800 border-slate-700 px-2 py-1 rounded text-slate-200`}>24?쒓컙 ?곷떞</span>
                        <span className={`bg-slate-800 border-slate-700 px-2 py-1 rounded text-slate-200 hidden sm:inline-block`}>?ㅼ떆媛??듬?</span>
                    </div>
                    <button
                        onClick={() => onAction('RESERVE')}
                        className={`bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-lg active:scale-95`}
                    >
                        <CalendarCheck size={14} />
                        諛붾줈 ?덉빟?섍린
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-4 no-scrollbar" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex flex-col items-start gap-2`}>
                            <div className={`p-4 text-sm leading-relaxed ${msg.role === 'user'
                                ? `bg-slate-800 text-white rounded-2xl rounded-tr-sm shadow-sm self-end`
                                : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm w-full'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.text}</div>

                                {/* Action Buttons for AI messages */}
                                {msg.role === 'model' && msg.action && msg.action !== 'NONE' && (
                                    <>
                                        {msg.action === 'SHOW_FORM_A' && (
                                            <FuneralRequestForm onSubmit={(text) => handleSend(text)} />
                                        )}

                                        {msg.action === 'RECOMMEND' && recommendedCandidates.length > 0 && (
                                            <div className="mt-3 flex flex-col gap-2">
                                                {recommendedCandidates.map(cand => (
                                                    <div
                                                        key={cand.id}
                                                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all active:scale-95 group"
                                                        onClick={() => onSwitchToFacility && onSwitchToFacility(cand)}
                                                    >
                                                        <div className="flex gap-3">
                                                            {cand.imageUrl && !cand.imageUrl.includes('placeholder') ? (
                                                                <img src={cand.imageUrl} alt={cand.name} className="w-14 h-14 rounded-lg object-cover bg-slate-200 border border-slate-100" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-lg bg-indigo-50 flex items-center justify-center text-xs text-indigo-400 font-bold border border-indigo-100 shrink-0">
                                                                    {cand.name.slice(0, 2)}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{cand.name}</h4>
                                                                    <div className="flex items-center gap-1 text-[9px] bg-white border border-indigo-100 px-1.5 py-0.5 rounded-full text-indigo-600 font-bold">
                                                                        AI ?곷떞
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mb-1 truncate">{cand.address}</p>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="text-amber-500 flex items-center gap-0.5 font-bold"><Star size={10} fill="currentColor" /> {cand.rating}</span>
                                                                    <span className="text-slate-400">由щ럭 {cand.reviewCount}媛?/span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 underline transition mt-1"
                                                    onClick={() => onAction('RECOMMEND')}
                                                >
                                                    ?꾩껜 紐⑸줉 ??蹂닿린
                                                </button>
                                            </div>
                                        )}

                                        {/* Other Actions */}
                                        {msg.action !== 'SHOW_FORM_A' && (msg.action !== 'RECOMMEND' || recommendedCandidates.length === 0) && (
                                            <button
                                                onClick={() => onAction(msg.action!)}
                                                className="mt-3 w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition font-bold shadow-sm"
                                            >
                                                {msg.action === 'RESERVE' && <><CalendarCheck size={16} /> ?덉빟 ?곷떞 ?묒닔</>}
                                                {msg.action === 'MAP' && <><MapPin size={16} /> ?ㅼ떆??湲?蹂닿린</>}
                                                {msg.action === 'CALL_MANAGER' && <><Phone size={16} /> ?대떦???꾪솕 ?곌껐</>}
                                                {msg.action === 'RECOMMEND' && <><Sparkles size={16} /> 異붿쿇 寃곌낵 蹂닿린</>}
                                                {msg.action === 'SWITCH_TO_CONSULT' && <><Phone size={16} /> ?꾨Ц ?곷떞???곌껐</>}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.32s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.16s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* FAQ Chips */}
            <div className="bg-white border-t border-slate-100 p-3 pb-0">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {activeFaqList.map((faq, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(faq.question)}
                            disabled={isLoading}
                            className="flex-shrink-0 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-full transition whitespace-nowrap flex items-center gap-1.5 active:scale-95"
                        >
                            <span>{faq.icon}</span>
                            <span className="font-medium">{faq.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 pt-2 pb-6">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all px-4 py-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="沅곴툑?섏떊 ?먯쓣 留먯??댁＜?몄슂..."
                            className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-slate-400"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Sparkles size={10} /> Powered by Gemini 2.0 Flash
                    </p>
                </div>
            </div>
        </div>
    );
};
