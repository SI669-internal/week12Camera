import React, { useEffect, useState } from 'react';
import { TextInput, Text, View, 
  FlatList, TouchableOpacity, StyleSheet, Button, Alert } 
  from 'react-native';  
import { getAuth, onAuthStateChanged,
          signInWithEmailAndPassword,
          createUserWithEmailAndPassword
        } from "firebase/auth";
import { getDataModel } from './DataModel';

const auth = getAuth(); 

export function LoginScreen ({navigation, route}) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('')
  const [mode, setMode] = useState('login');
  const [users, getUsers] = useState([]);

  const dataModel = getDataModel();

  useEffect(()=>{
    onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        console.log("user logged in!", authUser);
        dataModel.initOnAuth();
        navigation.navigate('Main', {currentAuthUserId: authUser.uid});
      } else {
        navigation.navigate('Login');
      }
    });
  }, []);

  return (
    <View style={loginStyles.body}>
      
      <View style={loginStyles.loginContainer}>

        <View style={loginStyles.loginRow}>
          <View style={loginStyles.loginLabelContainer}>
            <Text style={loginStyles.loginLabelText}>Email: </Text>
          </View>
          <View style={loginStyles.loginInputContainer}>
            <TextInput 
              style={loginStyles.loginInputBox}
              placeholder='enter email address' 
              autoCapitalize='none'
              spellCheck={false}
              value={email}
              onChangeText={(text)=>{setEmail(text)}}
            />
          </View>
        </View>

        <View style={loginStyles.loginRow}>
          <View style={loginStyles.loginLabelContainer}>
            <Text style={loginStyles.loginLabelText}>Password: </Text>
          </View>
          <View style={loginStyles.loginInputContainer}>
            <TextInput 
              style={loginStyles.loginInputBox}
              placeholder='enter password' 
              secureTextEntry={true}
              value={password}
              onChangeText={(text)=>{setPassword(text)}}
            />
          </View>
        </View>

        {mode === 'signup' ? 
          <View style={loginStyles.loginRow}>
            <View style={loginStyles.loginLabelContainer}>
              <Text style={loginStyles.loginLabelText}>Display Name: </Text>
            </View>
            <View style={loginStyles.loginInputContainer}>
              <TextInput 
                style={loginStyles.loginInputBox}
                placeholder='enter display name' 
                autoCapitalize='none'
                spellCheck={false}
                value={displayName}
                onChangeText={(text)=>{setDisplayName(text)}}
              />
            </View>
          </View>
          :
          <View></View>
        }

        <View style={loginStyles.modeSwitchContainer}>
          {mode === 'login' ?
            <Text>New user? 
              <Text 
                onPress={()=>{setMode('signup')}} 
                style={{color: 'blue'}}> Sign up </Text> 
            instead!</Text>
          :
            <Text>Existing user? 
            <Text 
              onPress={()=>{setMode('login')}} 
              style={{color: 'blue'}}> Log In </Text> 
            instead!</Text>
          }
        </View>

        <View style={loginStyles.loginButtonRow}>
          <Button
            title={mode==='login'?'Log in':'Sign up'}
            onPress={async ()=>{

              if (mode === 'login') {
                try {
                  const credential = await signInWithEmailAndPassword(auth, email, password);
                  // const authUser = credential.user;      
                  // const user = await dataModel.getUserForAuthUser(authUser);
                  // navigation.navigate('People', {currentUserId: user.key});
                } catch(error) {
                  Alert.alert(
                    "Login Error",
                    error.message,
                    [
                      { text: "OK" }
                    ]
                  );
                }
                setEmail('');
                setPassword('');
            } else {
              try {
                const credential = await createUserWithEmailAndPassword(auth, email, password);  
                const authUser = credential.user;
                dataModel.createUser(authUser, displayName);
                //navigation.navigate('People', {currentUserId: userId});
              } catch(error) {
                Alert.alert(
                  "Sign Up Error",
                  error.message,
                  [
                    { text: "OK" }
                  ]
                );
              }
              setEmail('');
              setPassword('');
            }
          }}
          />
        </View>
      </View>
    </View>
  );
}

const loginStyles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '2%'
  },
  loginContainer: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
  },
  loginRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  loginLabelContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  loginLabelText: {
    fontSize: 18
  },
  loginInputContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%'
  },
  loginInputBox: {
    width: '100%',
    borderColor: 'lightgray',
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 18,
    padding: '2%'
  },
  modeSwitchContainer:{
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  loginButtonRow: {
    flex: 1, 
    width: '100%',
    justifyContent: 'center', 
    alignItems: 'center'
  }
});

// export function LoginScreen2 ({navigation, route}) {

//   const [users, setUsers] = useState([]);

//   useEffect(() => {
//     const dataModel = getDataModel();
//     const listenerId = dataModel.addUserListener(() => {
//       let newUsers = Array.from(dataModel.getUsers());
//       setUsers(newUsers);
//     });
//     return(() => {
//       dataModel.removeUserListener(listenerId);
//     });
//   }, []);

//   return (
//     <View style={styles.body}>
      
//       <View style={styles.header}>
//         <Text style={styles.mediumText}>Who are you?</Text>
//       </View>

//       <View style={styles.userListContainer}>
//         <FlatList
//           data={users}
//           renderItem={({item}) => {
//             return (
//               <TouchableOpacity
//                 style={styles.userListItem}
//                 onPress={()=>{
//                   navigation.navigate('People', {currentUserId: item.key})
//                 }}
//               >
//                 <Text style={styles.mediumText}>{item.displayName}</Text>
//               </TouchableOpacity>
//             );
//           }}
//         />
//       </View>

//     </View>
//   );
// }

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: '15%',
    paddingHorizontal: '2%'
  },
  mediumText: {
    fontSize: 18
  },
  header: {
    flex: 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  userListContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%'
  },
  userListItem: {
    flex: 1,
    width: '100%',
    padding: '5%'
  },
});

