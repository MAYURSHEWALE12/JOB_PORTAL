import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { companyAPI, getImageUrl } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Camera, Image as ImageIcon, Globe, MapPin, Building2, Users, Save, XCircle, Calendar, Tag, Sidebar, User, Briefcase, Share2, Info } from 'lucide-react';
import Loader from '../Loader';

const TABS = {
    BRAND: 'BRAND',
    INFO: 'INFO',
    SOCIAL: 'SOCIAL'
};

export default function EditCompanyProfile() {
    const { user } = useAuthStore();
    const [formData, setFormData] = useState({
        companyName: '',
        website: '',
        location: '',
        industry: '',
        employeeCount: '',
        description: '',
        foundedYear: '',
        specialties: '',
        linkedin: '',
        twitter: '',
        github: '',
    });
    
    const [logo, setLogo] = useState(null);
    const [banner, setBanner] = useState(null);
    const [currentLogo, setCurrentLogo] = useState('');
    const [currentBanner, setCurrentBanner] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS.BRAND);
    
    const logoInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await companyAPI.getByUser(user.id);
                if (res.data) {
                    setFormData({
                        companyName: res.data.companyName || '',
                        website: res.data.website || '',
                        location: res.data.location || '',
                        industry: res.data.industry || '',
                        employeeCount: res.data.employeeCount || '',
                        description: res.data.description || '',
                        foundedYear: res.data.foundedYear || '',
                        specialties: res.data.specialties || '',
                        linkedin: res.data.linkedin || '',
                        twitter: res.data.twitter || '',
                        github: res.data.github || '',
                    });
                    setCurrentLogo(res.data.logoUrl);
                    setCurrentBanner(res.data.bannerUrl);
                }
            } catch (err) {
                console.log('No profile found, start fresh');
            } finally {
                setLoading(false);
            }
        };
        
        if (user?.id) fetchProfile();
    }, [user?.id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        if (type === 'logo') setLogo(file);
        else setBanner(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await companyAPI.update(user.id, formData);
            if (logo) {
                const logoRes = await companyAPI.uploadLogo(user.id, logo);
                setCurrentLogo(logoRes.data.logoUrl);
                setLogo(null);
            }
            if (banner) {
                const bannerRes = await companyAPI.uploadBanner(user.id, banner);
                setCurrentBanner(bannerRes.data.bannerUrl);
                setBanner(null);
            }
            toast.success('Company profile updated successfully!');
        } catch (err) {
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;

    const SidebarItem = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-4 px-8 py-5 font-black uppercase text-xs tracking-widest transition-all
                ${activeTab === id ? 'bg-orange-500 text-stone-900 border-r-[8px] border-stone-900 shadow-inner' : 'text-stone-400 hover:text-stone-900 hover:bg-stone-50'}`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-12">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-8">
                <div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-stone-900 dark:text-white">Employer Branding</h2>
                    <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Manage your company's presence on the platform</p>
                </div>
                <button 
                    onClick={() => window.open(`/company/${user.id}`, '_blank')}
                    className="bg-stone-900 text-white px-8 py-2 font-black uppercase text-xs border-[3px] border-stone-900 shadow-[6px_6px_0_#ea580c] hover:shadow-none transition-all"
                >
                    View Public Profile
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-white dark:bg-stone-900 border-[4px] border-stone-900 shadow-[16px_16px_0_#000] overflow-hidden min-h-[600px]">
                
                {/* Sidebar Navigation */}
                <div className="md:col-span-3 border-r-[4px] border-stone-900 flex flex-col pt-8">
                    <SidebarItem id={TABS.BRAND} label="Company Branding" icon={ImageIcon} />
                    <SidebarItem id={TABS.INFO} label="Basic Details" icon={Building2} />
                    <SidebarItem id={TABS.SOCIAL} label="Social & Mission" icon={Share2} />
                    
                    <div className="mt-auto p-8 border-t-[4px] border-stone-900 bg-stone-50 dark:bg-stone-800">
                        <p className="text-[10px] font-black uppercase text-stone-400">Branding Strength</p>
                        <div className="mt-2 h-2 bg-stone-200 dark:bg-stone-900 border border-stone-900">
                            <div className="h-full bg-emerald-400 w-[75%]" />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <form onSubmit={handleSubmit} className="md:col-span-9 p-8 lg:p-12 overflow-y-auto">
                    
                    {/* ──── Tab: Branding ──────────────────────────── */}
                    {activeTab === TABS.BRAND && (
                        <div className="animate-neo-thump space-y-12">
                            <h3 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-white border-b-[6px] border-orange-500 inline-block px-2">Visual Assets</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase text-stone-900 dark:text-white tracking-widest block">Primary Logo</label>
                                    <div className="relative group w-48 h-48 bg-stone-50 dark:bg-stone-800 border-[4px] border-stone-900 shadow-[8px_8px_0_#000] overflow-hidden group">
                                        {(logo || currentLogo) ? (
                                            <img 
                                                src={logo ? URL.createObjectURL(logo) : getImageUrl(`/companies/image/${currentLogo}`)} 
                                                alt="Logo" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                                            />
                                        ) : <div className="w-full h-full flex items-center justify-center opacity-10"><Building2 size={64}/></div>}
                                        <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-stone-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white" size={32} />
                                        </button>
                                        <input type="file" ref={logoInputRef} hidden onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase text-stone-900 dark:text-white tracking-widest block">Header Banner</label>
                                    <div className="relative group w-full h-48 bg-stone-50 dark:bg-stone-800 border-[4px] border-stone-900 shadow-[8px_8px_0_#000] overflow-hidden">
                                        {(banner || currentBanner) ? (
                                            <img 
                                                src={banner ? URL.createObjectURL(banner) : getImageUrl(`/companies/image/${currentBanner}`)} 
                                                alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon size={64}/></div>}
                                        <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-stone-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white" size={32} />
                                        </button>
                                        <input type="file" ref={bannerInputRef} hidden onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── Tab: Info ─────────────────────────────── */}
                    {activeTab === TABS.INFO && (
                        <div className="animate-neo-thump space-y-10">
                            <h3 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-white border-b-[6px] border-rose-500 inline-block px-2">Core Directory</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { name: 'companyName', label: 'Company Name', icon: Building2, type: 'text', required: true },
                                    { name: 'website', label: 'Website (example.com)', icon: Globe, type: 'text' },
                                    { name: 'location', label: 'Headquarters', icon: MapPin, type: 'text' },
                                    { name: 'industry', label: 'Primary Industry', icon: Tag, type: 'text' },
                                    { name: 'employeeCount', label: 'Team Size', icon: Users, type: 'select', options: ['', '1-50', '51-200', '201-500', '501-1000', '1000+'] },
                                    { name: 'foundedYear', label: 'Year Founded', icon: Calendar, type: 'text' },
                                ].map(field => (
                                    <div key={field.name} className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{field.label}</label>
                                        <div className="flex bg-stone-50 dark:bg-stone-950 border-[3px] border-stone-900 focus-within:shadow-[4px_4px_0_#000] focus-within:-translate-x-1 focus-within:-translate-y-1 transition-all">
                                            <div className="p-3 bg-stone-900 text-white border-r-[3px] border-stone-900"><field.icon size={18} /></div>
                                            {field.type === 'select' ? (
                                                <select name={field.name} value={formData[field.name]} onChange={handleChange} className="w-full bg-transparent p-3 outline-none font-bold uppercase text-xs">
                                                    {field.options.map(opt => <option key={opt} value={opt}>{opt || 'Select Size'}</option>)}
                                                </select>
                                            ) : (
                                                <input type="text" name={field.name} value={formData[field.name]} onChange={handleChange} required={field.required} className="w-full bg-transparent p-3 outline-none font-bold uppercase text-xs" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ──── Tab: Social ───────────────────────────── */}
                    {activeTab === TABS.SOCIAL && (
                        <div className="animate-neo-thump space-y-10">
                            <h3 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-white border-b-[6px] border-emerald-400 inline-block px-2">Brand Story</h3>
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Mission & Values</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows="6" className="w-full bg-stone-50 dark:bg-stone-950 border-[3px] border-stone-900 p-6 outline-none font-bold text-sm shadow-inner focus:shadow-[4px_4px_0_#000] transition-all resize-none" placeholder="What drives your company?" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">LinkedIn URL</label>
                                        <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full bg-stone-50 dark:bg-stone-950 border-[3px] border-stone-900 p-3 outline-none font-bold text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Key Specialties (Comma Separated)</label>
                                        <input type="text" name="specialties" value={formData.specialties} onChange={handleChange} className="w-full bg-stone-50 dark:bg-stone-950 border-[3px] border-stone-900 p-3 outline-none font-bold text-xs" placeholder="AI, Fintech, E-commerce" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="mt-16 pt-12 border-t-[4px] border-stone-100 dark:border-stone-800 flex gap-4">
                        <button 
                            type="submit" 
                            disabled={saving} 
                            className="bg-stone-900 text-white px-12 py-5 font-black uppercase tracking-widest text-xs border-[4px] border-stone-900 shadow-[8px_8px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Synchronizing...' : 'Save All Changes'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => window.history.back()}
                            className="bg-white text-stone-900 px-12 py-5 font-black uppercase tracking-widest text-xs border-[4px] border-stone-900 shadow-[8px_8px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        >
                            Discard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
