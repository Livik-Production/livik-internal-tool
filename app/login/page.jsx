'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import { fetchCurrentUser } from '../../store/slices/authSlice';
import CustomAlertForm from '../components/CustomAlertForm';

function StyledInput({
  className = '',
  type = 'text',
  value,
  onChange,
  placeholder,
  name,
  ...rest
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-5 py-3.5 text-[15px] border-none rounded-lg bg-[#f5f5f5] text-[#333333] outline-none transition-all duration-300 placeholder:text-[#999] focus:bg-white focus:shadow-[0_0_0_3px_rgba(30,144,255,0.2)] ${className}`}
      {...rest}
    />
  );
}

function StyledButton({
  type = 'button',
  disabled = false,
  onClick,
  children,
  className = '',
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full px-6 py-3.5 text-[15px] font-semibold border-none transition-all duration-300 outline-none rounded-lg bg-[#1E90FF] text-white 
        ${
          disabled
            ? 'cursor-not-allowed opacity-70'
            : 'cursor-pointer hover:bg-[#1873cc] hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-[#1E90FF] focus-visible:outline-offset-2'
        } ${className}`}
    >
      {children}
    </button>
  );
}

const OTPInputContext = React.createContext(null);

function InputOTP({
  value = '',
  onChange = () => {},
  maxLength = 6,
  className = '',
  containerClassName = '',
  children,
  autoFocus = false,
  ...rest
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    onChange(val);
  };

  const slots = Array.from({ length: maxLength }).map((_, idx) => {
    const char = value[idx] || '';
    // If input is focused, the active box is the one where the next character goes
    // If the value is full, the last box remains "active" or highlighted
    const isActive =
      isFocused &&
      (value.length === idx ||
        (value.length === maxLength && idx === maxLength - 1));
    const hasFakeCaret = isFocused && value.length === idx;
    return { char, isActive, hasFakeCaret };
  });

  return (
    <OTPInputContext.Provider value={{ slots }}>
      <div
        className={`relative ${containerClassName}`}
        onClick={() => inputRef.current?.focus()}
        {...rest}
      >
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-default"
          maxLength={maxLength}
        />
        <div className={`flex items-center gap-2 ${className}`}>{children}</div>
      </div>
    </OTPInputContext.Provider>
  );
}

function InputOTPGroup({ children, className = '', ...rest }) {
  return (
    <div className={`flex items-center ${className}`} {...rest}>
      {children}
    </div>
  );
}

function InputOTPSlot({ index = 0, className = '', ...rest }) {
  const ctx = React.useContext(OTPInputContext);
  if (!ctx) return null;
  const slot = ctx.slots[index] || {
    char: '',
    isActive: false,
    hasFakeCaret: false,
  };
  const { char, isActive, hasFakeCaret } = slot;

  return (
    <div
      role="presentation"
      className={`relative flex h-10 w-10 items-center justify-center border-y border-r border-gray-300 text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md bg-white ${
        isActive ? 'z-10 ring-2 ring-blue-400' : ''
      } ${className}`}
      {...rest}
    >
      <span>{char}</span>
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-pulse bg-black duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator(props) {
  return (
    <div role="separator" aria-hidden="true" className="px-1" {...props}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

function PhoneInput({ value, onChange, forgotPasswordMode = false }) {
  const handleChange = (e) => {
    const inputValue = e.target.value.replace(/\D/g, '');
    if (inputValue.length <= 10) {
      onChange(inputValue);
    }
  };

  if (forgotPasswordMode) {
    return (
      <div className="relative flex gap-0 w-full">
        {/* Static +91 Country Code */}
        <div className="flex items-center justify-center px-4 py-3.5 text-[15px] border-none rounded-l-lg bg-[#eaeaea] text-[#555] font-medium select-none cursor-not-allowed">
          +91
        </div>

        {/* Phone Number Input */}
        <StyledInput
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder="Enter 10-digit phone number"
          name="phone"
          required
          aria-label="Phone number"
          className="rounded-l-none"
        />
      </div>
    );
  }

  return (
    <div className="relative flex gap-2">
      {/* Country Code for regular login */}
      <input
        type="text"
        value="+91"
        disabled
        className="w-[50px] px-2 py-3.5 text-[15px] border-none rounded-lg bg-[#eaeaea] text-[#555] text-center cursor-not-allowed"
      />

      {/* Phone Number Input */}
      <StyledInput
        type="tel"
        placeholder="Mobile Number"
        name="mobile"
        value={value}
        onChange={handleChange}
        required
        autoComplete="tel"
        aria-label="Mobile Number"
        className="flex-1"
      />
    </div>
  );
}

function OtpLogin({ onBack, forgotPasswordMode = false }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const status = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === 'succeeded' && user) {
      router.replace('/dashboard');
    }
  }, [user, status, router]);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const verifyOtp = async () => {
    startTransition(async () => {
      setError('');

      if (!otpSent) {
        setError('Please request OTP first.');
        return;
      }

      if (otp.length !== 6) {
        setError('Please enter a 6-digit OTP.');
        return;
      }

      try {
        const mobile = phoneNumber.replace(/\D/g, '').slice(-10);

        const res = await fetch('/api/auth/otp-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, otp }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Invalid OTP');
        }

        // Forgot password flow
        if (forgotPasswordMode) {
          router.replace(
            `/create-password?mobile=${encodeURIComponent(mobile)}&mode=reset`
          );
          return;
        }

        // Check password existence
        const pwdRes = await fetch('/api/employees/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile }),
        });
        const pwdData = await pwdRes.json();

        if (pwdData.exists && pwdData.hasPassword) {
          const result = await dispatch(fetchCurrentUser());
          if (result.meta.requestStatus === 'fulfilled') {
            window.location.href = '/dashboard';
          }
        } else {
          router.replace(
            `/create-password?mobile=${encodeURIComponent(mobile)}`
          );
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to verify OTP. Please check the OTP.');
      }
    });
  };

  const requestOtp = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    setResendCountdown(60);
    setOtp(''); // Clear previous OTP
    setError('');

    startTransition(async () => {
      setError('');
      setSuccess('');

      try {
        const mobile = phoneNumber.replace(/\D/g, '').slice(-10);

        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to send OTP');
        }

        setOtpSent(true);
        setSuccess('OTP sent successfully to your registered email.');
      } catch (err) {
        setResendCountdown(0);
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    });
  };

  const loadingIndicator = (
    <div role="status" className="flex justify-center">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-green-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );

  return (
    <div className="w-full max-w-[450px] text-center animate-fadeIn px-5">
      <div className="mb-2 text-left">
        <button
          type="button"
          className="text-sm text-[#1E90FF] underline"
          onClick={onBack}
        >
          &larr; Back to password login
        </button>
      </div>

      {!otpSent && (
        <form onSubmit={requestOtp} className="flex flex-col gap-4">
          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            forgotPasswordMode={forgotPasswordMode}
          />

          <StyledButton
            type="button"
            onClick={() => requestOtp()}
            disabled={!phoneNumber || isPending || resendCountdown > 0}
          >
            {resendCountdown > 0
              ? `Resend OTP in ${resendCountdown}`
              : isPending
                ? 'Sending OTP...'
                : 'Send OTP'}
          </StyledButton>

          <div className="p-6 text-center w-full max-w-sm">
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
          </div>
        </form>
      )}

      {otpSent && (
        <div className="w-full max-w-[450px] text-center animate-fadeIn px-5">
          <div className="mt-4 w-full max-w-sm">
            <p className="text-sm text-gray-500 mb-4">
              OTP sent to your registered email.
            </p>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(val) => setOtp(val)}
              containerClassName="w-full"
              className="justify-center"
              autoFocus={true}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>

              <InputOTPSeparator />

              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="w-full max-w-sm mt-5">
            <StyledButton
              type="button"
              onClick={verifyOtp}
              disabled={isPending || otp.length !== 6}
            >
              {isPending ? 'Verifying...' : 'Verify OTP'}
            </StyledButton>
          </div>

          <div className="w-full max-w-sm mt-3">
            <StyledButton
              type="button"
              onClick={requestOtp}
              disabled={isPending || resendCountdown > 0}
            >
              {resendCountdown > 0
                ? `Resend OTP in ${resendCountdown}s`
                : 'Resend OTP'}
            </StyledButton>
          </div>

          <div className="p-6 text-center w-full max-w-sm">
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
          </div>
        </div>
      )}

      {isPending && loadingIndicator}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
  });

  const [showMobileLogin, setShowMobileLogin] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const status = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === 'succeeded' && user) {
      router.replace('/dashboard');
    }
  }, [user, status, router]);

  const [isPending, startTransition] = useTransition();

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { mobile, password } = formData;

    if (!mobile || !password) {
      setAlertConfig({
        isOpen: true,
        title: 'Input Required',
        message: 'Mobile number and password are required',
        type: 'warning',
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile: mobile.replace('+91', '').trim(),
            password,
          }),
        });

        const data = await res.json();

        if (res.status === 409 && data.passwordNotSet) {
          setAlertConfig({
            isOpen: true,
            title: 'Password Not Set',
            message:
              'Password not created yet. Please login with OTP and create password.',
            type: 'info',
          });
          return;
        }

        if (!res.ok) {
          setAlertConfig({
            isOpen: true,
            title: 'Login Failed',
            message: data.message || 'Invalid credentials. Please try again.',
            type: 'danger',
          });
          return;
        }

        const result = await dispatch(fetchCurrentUser());
        if (result.meta.requestStatus === 'fulfilled') {
          window.location.href = '/dashboard';
        }
      } catch (err) {
        console.error(err);
        setAlertConfig({
          isOpen: true,
          title: 'Error',
          message: 'Something went wrong. Please try again.',
          type: 'danger',
        });
      }
    });
  };

  return (
    <div className="w-full max-w-[450px] text-center animate-fadeIn px-5">
      <div className="mb-6">
        <div className="w-[120px] h-[120px] rounded-full inline-flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.2)] mb-4 overflow-hidden bg-white">
          <Image
            src="/asset/livik-logo.png"
            alt="Livik Logo"
            width={85}
            height={85}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {!showMobileLogin ? (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <PhoneInput
            value={formData.mobile}
            onChange={(value) => setFormData((s) => ({ ...s, mobile: value }))}
            forgotPasswordMode={false}
          />

          <div className="relative">
            <StyledInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleFormChange}
              required
              autoComplete="current-password"
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full px-6 py-3.5 text-[15px] font-semibold border-none transition-all duration-300 outline-none rounded-lg bg-[#1E90FF] text-white flex items-center justify-center gap-2 
              ${isPending ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-[#1873cc] hover:-translate-y-[1px] active:translate-y-0'}`}
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div className="flex items-center justify-between mt-1">
            <button
              type="button"
              className="text-[14px] font-medium cursor-pointer transition-all duration-300 outline-none text-[#1E90FF] hover:text-[#5eb8ff] underline focus-visible:outline-2 focus-visible:outline-[#1E90FF] focus-visible:outline-offset-2"
              onClick={() => {
                setShowMobileLogin(true);
                setForgotPasswordMode(true);
              }}
            >
              Forgot Password?
            </button>

            <button
              type="button"
              className="text-[14px] font-medium cursor-pointer transition-all duration-300 outline-none text-[#1E90FF] hover:text-[#5eb8ff] underline focus-visible:outline-2 focus-visible:outline-[#1E90FF] focus-visible:outline-offset-2"
              onClick={() => {
                startTransition(() => {
                  setShowMobileLogin(true);
                });
              }}
            >
              Login With OTP
            </button>
          </div>
        </form>
      ) : (
        <OtpLogin
          forgotPasswordMode={forgotPasswordMode}
          onBack={() => {
            setShowMobileLogin(false);
            setForgotPasswordMode(false);
          }}
        />
      )}

      <CustomAlertForm
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        onConfirm={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText="OK"
      />
    </div>
  );
}
