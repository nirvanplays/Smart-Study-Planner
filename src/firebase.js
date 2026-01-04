import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDQDwpcke88HdW03bLSQPSdNktCIEeGYag",
    authDomain: "smart-study-planner-86f98.firebaseapp.com",
    projectId: "smart-study-planner-86f98",
    storageBucket: "smart-study-planner-86f98.appspot.com",
    messagingSenderId: "643792939730",
    appId: "1:643792939730:web:b5b68191857e0819e05b0b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
