import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
    apiKey: "AIzaSyDKtLEVtoxEUhLep9Md6RWzYkqPAZ8tzfY", 
    authDomain: "ai-course-generator-13d59.firebaseapp.com",
    projectId: "ai-course-generator-13d59",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
export { auth }; 
