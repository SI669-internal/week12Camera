import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Image, 
  TouchableOpacity, Button } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Camera } from 'expo-camera';

import { LoginScreen } from './LoginScreen';
import { getDataModel } from './DataModel';
import { getAuth, signOut } from '@firebase/auth';

const auth = getAuth();

function MainScreen({navigation}) {

  // get a reference to the DataModel
  const dataModel = getDataModel();

  // initialize state with the placeholder image
  const [image, setImage] = useState(require('./assets/ImageNotAvailable.png'));
  const [userDisplayName, setUserDisplayName] = useState('User');

  // subscribe to updates, specifying the callback
  useEffect(()=>{
    dataModel.subscribeToImageUpdate((imageObj) => {
      console.log('updating image', imageObj);
      setImage(imageObj);
    });
    dataModel.addUserSnapshotListener(async () => {
      console.log('getting current user info');
      setUserDisplayName(await dataModel.getCurrentUserDisplayName());
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text> Hi, {userDisplayName}! </Text>
      <Button
        title='Sign out'
        onPress={()=> {
          dataModel.disconnectOnSignout();
          signOut(auth)
        }}
      />
      <Image
        style={styles.mainImage}
        source={image}
      />
      <Button
        title="Take a Picture!"
        onPress={()=>{
          navigation.navigate('Camera');
        }}
      />
    </View>
  );

}

function CameraScreen({navigation}) {

  const dataModel = getDataModel();
  const [hasPermission, setHasPermission] = useState(null);
  
  useEffect(() => {
    async function getPermissions(){
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    }
    getPermissions();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  let theCamera = undefined;
  return (
    <View style={styles.cameraContainer}>
      <Camera 
        style={styles.camera}
        ratio='4:3'
        ref={ref => theCamera = ref}
      />
      <TouchableOpacity 
        style={styles.cameraControls}
        onPress={async ()=>{
          let picData = await theCamera.takePictureAsync({quality: 0.2});
          dataModel.updateImage(picData);
          navigation.goBack();
        }}>
        <Text style={styles.snapText}>Snap!</Text>
      </TouchableOpacity>
    </View>
  );

}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"   
        screenOptions={{headerShown: false}}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 100,
    resizeMode: 'contain'
  },

  mainImage: {
    height: 400,
    width: 300,
    resizeMode: 'contain'
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 0.85,
  },
  cameraControls: {
    flex: 0.15, 
    justifyContent: 'flex-start', 
    alignItems: 'center',
    padding: '5%',
    width: '100%',
    backgroundColor: '#222'
  },
  snapText: {
    fontSize: 36,
    color: 'white'
  },
});

