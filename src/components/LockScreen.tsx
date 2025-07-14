
"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface LockScreenProps {
  isPinSet: boolean;
  onPinSubmit: (pin: string) => Promise<boolean>;
  onPinSet: (pin: string) => void;
  onReset: () => void;
}

export default function LockScreen({ isPinSet, onPinSubmit, onPinSet, onReset }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(!isPinSet);
  const { toast } = useToast();

  const handlePinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numeric input up to 6 digits
    if (/^\d{0,6}$/.test(value)) {
      setPin(value);
      if (error) setError('');
    }
  };
  
  const handleConfirmPinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setConfirmPin(value);
      if (error) setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSettingPin) {
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits.');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match.');
        return;
      }
      onPinSet(pin);
      toast({ title: 'PIN Set Successfully!', description: 'The app is now secured.' });
    } else {
      const success = await onPinSubmit(pin);
      if (!success) {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    }
  };

  const handleResetApp = () => {
    onReset();
    toast({ title: "App Reset", description: "All data has been cleared. You can now set a new PIN.", duration: 5000 });
    setIsSettingPin(true);
    setPin('');
    setConfirmPin('');
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="mt-4">{isSettingPin ? 'Set Your PIN' : 'Enter PIN'}</CardTitle>
            <CardDescription>
              {isSettingPin
                ? 'Create a 4-6 digit PIN to secure your data.'
                : 'Enter your PIN to unlock the app.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={handlePinInputChange}
              className="text-center text-lg tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />
            {isSettingPin && (
              <Input
                type="password"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={handleConfirmPinInputChange}
                className="text-center text-lg tracking-[0.5em]"
                maxLength={6}
              />
            )}
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={pin.length < 4}>
              {isSettingPin ? 'Set PIN' : 'Unlock'}
            </Button>
            {isPinSet && !isSettingPin && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="link" size="sm" type="button">Forgot PIN?</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>Reset Your Data?</AlertDialogTitle>
                            <AlertDialogDescription>
                                If you forgot your PIN, the only way to regain access is to reset the app. This will permanently delete all your bookmarks, statuses, and settings. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetApp} className="bg-destructive hover:bg-destructive/90">Reset App Data</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
