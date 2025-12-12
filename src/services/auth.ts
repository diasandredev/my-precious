import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";

import { dbService } from "./db";

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User> => {
    try {
        // Wipe storage before login to ensure clean state
        await dbService.clear();
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
        // Wipe storage on logout
        await dbService.clear();
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
