import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View,Image,KeyboardAvoidingView,ToastAndroid, Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner'
import { styleSheets } from 'min-document';
import { TextInput } from 'react-native-gesture-handler';
import firebase from 'firebase';
import db from '../config';
import { disableFallbacks } from 'getenv';

export default class TransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
          scannedBookId:'',
          scannedStudentId:'',
            buttonState:'normal',
            transactionMessage:''
        }
    }
    getCameraPermissions=async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA)
        this.setState(
            {
                hasCameraPermissions:status==="granted",
                buttonState :id,
                scanned:false
                
            }
        )
    }
    handleBarCodeScanned=async({type,data})=>{
       const {buttonState}=this.state

       if(buttonState==="BookId"){
        this.setState({
            scanned:true,
            scannedBookId:data,
            buttonState:'normal'
        })
       }else if(buttonState==="StudentId"){
        this.setState({
            scanned:true,
            scannedStudentId:data,
            buttonState:'normal'
        })
       }
    }
    initiateBookIssue=async()=>{
        db.collection("transaction").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':'Issue'
        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':false
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1)
        })
        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }
    initiateBookReturn=async()=>{
        db.collection("transaction").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':'Return'
        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }

    checkbookEligibility=async()=>{
        const bookRef=await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
        var transactionType=''
        if(bookRef.docs.length==0){
            transactionType=false;
            alert ("Book is not in the library")
        }
        else{
            bookRef.docs.map((doc)=>{
                var book=doc.data()
                if (book.bookAvailability){
                    transactionType='Issue'
                }
                else {
                    transactionType="Return"
                }
            })
        }
        return transactionType
    }

    handleTransaction=async()=>{
       var transactionType=await this.checkbookEligibility();
       if(!transactionType){
           alert("The book does not exist in our library")
           this.setState({
            scannedStudentId:'',
            scannedBookId:''
           })
       }
       else if(transactionType==="Issue"){
           var isStudentEligibile=await this.checkStudentEligibilityForBookIssue()
           if (isStudentEligibile){
               this.initiateBookIssue();
              alert("book Issued to the student")
           }
       }
       else {
        var isStudentEligibile=await this.checkStudentEligibilityForBookReturn()
        if (isStudentEligibile){
            this.initiateBookReturn();
           alert("book Return to the Library")
        }
    }
    }
    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef=await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
        var isStudentEligibile=''
        if(studentRef.docs.length==0){
            isStudentEligibile=false;
            alert ("The student is not from the school")
        }
        else{
            studentRef.docs.map((doc)=>{
                var student=doc.data()
               if(student.numberOfBooksIssued<2){
                   isStudentEligibile=true
               }
               else{
                   isStudentEligibile=false
                   alert("the student has already taken two books")
               }
            })
        }
        return isStudentEligibile   
    }
    checkStudentEligibilityForBookReturn=async()=>{
       const transactionRef = await db.collection("transaction").where("bookId","==",this.state.scannedBookId).limit(1).get()
       var isStudentEligibile=''
       transactionRef.docs.map((doc)=>{
           var lastBookTransaction=doc.data()
           if(lastBookTransaction.studentId===this.state.scannedStudentId){
               isStudentEligibile=true
           }
           else{
            isStudentEligibile=false
            alert("the book was not issued by this student")
           }
       })
    }

    render(){
       const hasCameraPermissions=this.state.hasCameraPermissions;
       const scanned=this.state.scanned;
       const buttonState=this.state.buttonState;
       
       if(buttonState!== 'normal' && hasCameraPermissions){
           return(
               <BarCodeScanner
               onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
               style={StyleSheet.absoluteFillObject}/>
           )
       }

       else if(buttonState==='normal'){
           return(
               <KeyboardAvoidingView style={styles.container } behavior="padding" enabled>
                   <View>
                       <Image 
                       source={require("../assets/booklogo.jpg")}
                        style={{width:200,height:200}}/>
                        <Text style={{textAlign:'center',fontSize:30}}>WILY</Text>
                       </View>
                       <View style={styles.inputView}>
                           <TextInput
                           style={styles.inputBox}
                           placeholder="Book Id"
                           onChangeText={text=>this.setState({scannedBookId:text})}
                           value={this.state.scannedBookId}/>
                           <TouchableOpacity
                           style={styles.scanButton}
                           onPress={()=>{this.getCameraPermissions("BookId")}}>
                               <Text style={styles.buttonText}>Scan</Text>
                           </TouchableOpacity>
                       </View>
                       <View style={styles.inputView}>
                           <TextInput
                           style={styles.inputBox}
                           placeholder="Student Id"
                           onChangeText={text=>this.setState({scannedStudentId:text})}
                           value={this.state.scannedStudentId}/>
                           <TouchableOpacity
                           style={styles.scanButton}
                           onPress={()=>{this.getCameraPermissions("StudentId")}}>
                               <Text style={styles.buttonText}>Scan</Text>
                           </TouchableOpacity>
                       </View>
                       <TouchableOpacity
                       style={styles.submmitbutton}
                       onPress={async()=>{
                           var transactionMessage=this.handleTransaction()
                       }}>
                           <Text style={styles.submmitButtonText}>Submmit</Text>
                       </TouchableOpacity>
               </KeyboardAvoidingView>
           )
       }

    }
} 
 const styles=StyleSheet.create({
     container:{
         flex:1,
         justifyContent:'center',
         alignItems:'center'
     },
     displaytext:{
         fontSize:15,
         textDecorationLine:'underline'
     },
     scanButton:{
         backgroundColor:'blue',
         padding:10,
         margin:10
     },
     buttonText:{
         fontSize:20,
         textAlign:'center',
         marginTop:10
     },
     inputView:{
         flexDirection:'row',
         margin:20
     },
     inputBox:{
         width:200,
         height:40,
         borderWidth:1.5,
         borderRightWidth:0,
         fontSize:20
     },
     scanButton:{
         backgroundColor:'#66bb6a',
         width:50,
         borderWidth:1.5,
         borderLeftWidth:0
     },
     submmitButton:{
         backgroundColor:'blue',
         width:100,
         height:100
     },
     submmitButtonText:{
         padding:10,
         textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'black'
     }

 })


 