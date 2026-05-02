import { X, Search, User, Mail, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'register';
  onSwitch: (type: 'login' | 'register') => void;
  onSuccess: (user: any) => void;
}

const CustomSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <div 
    onClick={onChange}
    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${checked ? 'bg-[#7CBB3D]' : 'bg-[#4B4B4B]'}`}
  >
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-7' : 'left-1'}`} />
  </div>
);

export default function AuthModal({ isOpen, onClose, type, onSwitch, onSuccess }: AuthModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeRules, setAgreeRules] = useState(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Mock login/register success
    onSuccess({
      id: '84653',
      balance: 0.00,
      currency: 'ETB',
      phoneNumber
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black w-full max-w-md overflow-hidden relative z-10 border border-brand-border"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-[#7CBB3D] font-black text-2xl uppercase tracking-tight">
                  {type === 'login' ? 'LOGIN' : 'CREATE YOUR ACCOUNT'}
                </h2>
                <button onClick={onClose} className="text-white hover:text-[#7CBB3D] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="w-full h-[1px] bg-[#7CBB3D] mb-8" />

              <form onSubmit={handleSubmit} className="space-y-6">
                {type === 'register' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#7CBB3D] text-[11px] font-bold uppercase mb-2">Phone number*</label>
                      <div className="flex gap-2">
                        <div className="bg-black border border-[#7CBB3D] px-4 py-3 text-[#7CBB3D] font-bold rounded-sm min-w-[70px] text-center">
                          +251
                        </div>
                        <input 
                          type="text" 
                          placeholder="Phone Number"
                          className="flex-1 bg-black border border-[#7CBB3D] px-4 py-3 text-white focus:outline-none placeholder:text-gray-600 font-bold"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#7CBB3D] text-[11px] font-bold uppercase mb-2">Password*</label>
                      <input 
                        type="password" 
                        placeholder="Enter Password"
                        className="w-full bg-black border border-[#7CBB3D] px-4 py-3 text-white focus:outline-none placeholder:text-gray-600 font-bold"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[#7CBB3D] text-[11px] font-bold uppercase mb-2">Confirm Password*</label>
                      <input 
                        type="password" 
                        placeholder="Confirm Password"
                        className="w-full bg-black border border-[#7CBB3D] px-4 py-3 text-white focus:outline-none placeholder:text-gray-600 font-bold"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <span className="text-[#7CBB3D] text-[11px] font-bold leading-tight">
                        By clicking button below, you agree to our<br />Rules *
                      </span>
                      <CustomSwitch checked={agreeRules} onChange={() => setAgreeRules(!agreeRules)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#7CBB3D] text-[11px] font-bold uppercase mb-2">Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="Phone Number"
                        className="w-full bg-black border border-[#7CBB3D] px-4 py-3 text-white focus:outline-none placeholder:text-gray-600 font-bold"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[#7CBB3D] text-[11px] font-bold uppercase mb-2">Password</label>
                      <input 
                        type="password" 
                        placeholder="Enter your password"
                        className="w-full bg-black border border-[#7CBB3D] px-4 py-3 text-white focus:outline-none placeholder:text-gray-600 font-bold"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[#7CBB3D] text-[11px] font-bold uppercase">Remember me</span>
                      <CustomSwitch checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-[#B3B3B3] hover:bg-white text-[#2C2C2C] font-black py-4 rounded-full text-sm uppercase transition-all mt-4"
                >
                  {type === 'login' ? 'LOGIN' : 'CONFIRM'}
                </button>

                {type === 'login' && (
                  <div className="text-center space-y-4">
                    <div className="text-white text-[11px] font-bold">
                      Restore password <span className="text-[#7CBB3D]">or</span> Contact us
                    </div>
                    <div className="w-full h-[1px] bg-white/10" />
                    <div className="text-[#7CBB3D] text-[11px] font-bold uppercase">Don't have an account?</div>
                    <button 
                      type="button"
                      onClick={() => onSwitch('register')}
                      className="w-full bg-[#E8E10C] text-black font-black py-4 rounded-full text-sm uppercase shadow-[0_0_20px_rgba(232,225,12,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      REGISTER
                    </button>
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
