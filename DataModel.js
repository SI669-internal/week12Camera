import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, setDoc, getDoc, doc, collection,
  onSnapshot
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } 
  from 'firebase/storage';
  import { getAuth } from "firebase/auth";

import { firebaseConfig } from './Secrets';

let app;
if (getApps().length == 0){
  app = initializeApp(firebaseConfig);
} 
const storage = getStorage(app);
const db = initializeFirestore(app, {
  useFetchStreams: false
});
const auth = getAuth(); 

class DataModel {
  constructor() {
    this.theImage = undefined; // the one and only image in the app
    this.theCallback = undefined; // a callback so that MainScreen can be notified
    this.currentPhotoRef = ref(storage, 'images/currentPhoto.jpg');
    
    this.users = [];
    this.userSnapshotUnsub = undefined; 
    this.userSnapshotListeners = [];

  }

  initOnAuth() {
    if (this.userSnapshotUnsub) {
      this.userSnapshotUnsub();
    }
    this.userSnapshotUnsub = onSnapshot(collection(db, 'users'), qSnap => {
      let updatedUsers = [];
      qSnap.forEach(docSnap => {
        let user = docSnap.data();
        user.key = docSnap.id;
        updatedUsers.push(user);
      });
      this.users = updatedUsers;
      this.notifyUserSnapshotListeners();
    });
    const setupDownloadURL = async () => {
      this.downloadURL = await getDownloadURL(this.currentPhotoRef);
      console.log(this.downloadURL);
      this.theImage = {uri: this.downloadURL};
      if (this.theCallback) {
        this.theCallback(this.theImage);
      }
    }
    setupDownloadURL();
  }

  disconnectOnSignout() {
    if (this.userSnapshotUnsub) {
      this.userSnapshotUnsub();
      this.userSnapshotUnsub = undefined;
    }
  }

  addUserSnapshotListener(callback) {
    const id = Date.now();
    this.userSnapshotListeners.push({
      callback: callback,
      id: id
    });
    callback();
    return id;
  }

  removeUserSnapshotListener(id) {
    const idx = this.userSnapshotListeners.findIndex(elem => elem.id === id);
    if (idx !== -1) {
      this.userSnapshotListeners.splice(idx, 1);
    }
  }

  notifyUserSnapshotListeners() {
    for (usl of this.userSnapshotListeners) {
      usl.callback();
    }
  }

  createUser(authUser, displayName) {
    setDoc(doc(db, 'users', authUser.uid), {displayName: displayName});
  }

  async getCurrentUserDisplayName() {
    const authUser = auth.currentUser;
    const userDocSnap = await getDoc(doc(db, 'users', authUser.uid));
    const user = userDocSnap.data();
    console.log('got display name: ', user.displayName);
    return user.displayName;
  }

  // this will allow the MainScreen to be notified when a new image is ready
  subscribeToImageUpdate = (callback) => {
    this.theCallback = callback;
  }

  // this will allow the CameraScreen to update the image
  updateImage = async (imageObject) => {
        
    // fetch the image object from the local filesystem
    const response = await fetch(imageObject.uri);
    const imageBlob = await response.blob();
    
    // then upload it to Firebase Storage
    const uploadTask = uploadBytesResumable(this.currentPhotoRef, imageBlob);

    uploadTask.on('state_changed',  
      (snapshot) => {
        console.log('total bytes', snapshot.totalBytes);
        console.log('total bytes', snapshot.bytesTransferred);
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      }, 
      (error) => {
        console.log(error);
      }, 
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
        });
      }
    );

    // now update our in-app variables
    this.theImage = imageObject;

    // and update listeners
    if (this.theCallback) {
      this.theCallback(imageObject);
    }
  }


}

// the singleton pattern, same as before
let theDataModel = undefined;
export function getDataModel() {
  if (!theDataModel) {
    theDataModel = new DataModel();
  }
  return theDataModel;
}