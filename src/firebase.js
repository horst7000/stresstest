// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, doc, updateDoc, addDoc, orderBy, deleteDoc } from 'firebase/firestore';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5IeEhnr2Fl_0wUqN0YEnIj23ys87ZTKk",
  authDomain: "everythingsabox.firebaseapp.com",
  projectId: "everythingsabox",
  storageBucket: "everythingsabox.appspot.com",
  messagingSenderId: "302986535856",
  appId: "1:302986535856:web:cf563134171c10ba996c75"
};

// Initialize Firebase
const firebaseApp     = initializeApp(firebaseConfig);
const db              = getFirestore(firebaseApp);
const boxesCollection = collection(db, 'boxes2');
const boxesQuery      = query(boxesCollection, orderBy("level", "desc"), orderBy("chunk"));

// Boxes
// const listenToBoxes = (store) => {
//     const q     = query(boxesCollection, orderBy("chunkLength"), orderBy("chunk"))
//     const unsub = onSnapshot(q, (querySnapshot) => {
//         const boxes = new Array(querySnapshot.docs.length);
//         for (let i = 0; i < querySnapshot.docs.length; ++i) {
//             const doc   = querySnapshot.docs[i]
//             boxes[i]    = doc.data();
//             boxes[i].id = doc.id;
//             boxes[doc.id] = boxes[i]
//         }
//         store.boxes = boxes;
//         store.updateBoxes();
//     });
//     return unsub
// }

const updateBox = async (id, updates) => {
    const box = doc(boxesCollection, '/', id)
    await updateDoc(box, updates)
}

const createBox = (props) => {
    let newBoxRef = addDoc(boxesCollection, props);
    return newBoxRef.id;
}

const deleteBox = (id) => {
    const box = doc(boxesCollection, '/', id)
    deleteDoc(box)
}

export {
    firebaseApp,
    boxesCollection,
    updateBox,
    createBox,
    deleteBox,
}