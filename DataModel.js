import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, setDoc, getDoc, collection
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } 
  from 'firebase/storage';
import { firebaseConfig } from './Secrets';

import * as FileSystem from 'expo-file-system';

let app;
if (getApps().length == 0){
  app = initializeApp(firebaseConfig);
} 
const storage = getStorage(app);

class DataModel {
  constructor() {
    this.theImage = undefined; // the one and only image in the app
    this.theCallback = undefined; // a callback so that MainScreen can be notified
    this.currentPhotoRef = ref(storage, 'images/currentPhoto.jpg');
    
    const setupDownloadURL = async () => {
      this.downloadURL = await getDownloadURL(this.currentPhotoRef);
      console.log(this.downloadURL);
      this.theImage = {uri: this.downloadURL};
      if (this.theCallback) {
        console.log('calling back, image gotted');
        this.theCallback(this.theImage);
      }
    }
    setupDownloadURL();
  }

  // this will allow the MainScreen to be notified when a new image is ready
  subscribeToImageUpdate = (callback) => {
    this.theCallback = callback;
  }

  // this will allow the CameraScreen to update the image
  updateImage = async (imageObject) => {
    
    let images = [
      'https://wallpaperaccess.com/full/86948.jpg',
      'https://wallpaperaccess.com/full/1124086.jpg'
    ];
    
    // fetch the image object from the local filesystem
    console.log('before fetch');
    const response = await fetch(imageObject.uri);
    console.log('before blob');
    const imageBlob = await response.blob();
    console.log('after blob');

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