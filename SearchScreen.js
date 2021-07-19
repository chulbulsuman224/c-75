import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput,TouchableOpacity, TouchableOpacityBase } from 'react-native';
import db from '../config';
import TransactionScreen from './BookTransactionScreen';

export default class SearchScreen extends React.Component{
    constructor(props){
        super(props);
        this.state={
            allTransactions:[],
            lastVisibleTransaction:null,
            search:''
        }
    }

    searchTransaction=async(text)=>{
        var enteredText=text.split("")
        if(enteredText[0].toUpperCase()==='B'){
            const transaction=await db.collection("transaction").where('bookId','==',text).get()
            transaction.docs.map((docs)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
        if(enteredText[0].toUpperCase()==='S'){
            const transaction=await db.collection("transaction").where('studentId','==',text).get()
            transaction.docs.map((docs)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
    }
    fetchMoreTransactions=async()=>{
        var text=this.state.search.toUpperCase()
        var enteredText=text.split("")
        if(enteredText[0].toUpperCase()==='B'){
            const transaction=await db.collection("transaction").where('bookId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
            transaction.docs.map((docs)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
        if(enteredText[0].toUpperCase()==='S'){
            const transaction=await db.collection("transaction").where('studentId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
            transaction.docs.map((docs)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
    }
    componentDidMount=async()=>{
        const query=await db.collection("transaction").limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[],
                lastVisibleTransaction:''
            })
        })
    }

    render(){
        return(
           <View style={styles.container}>
               <View style={styles.searchBar}>
                   <TextInput
                   style={styles.bar}
                   placeholder="bookId or studentId"
                   onChangeText={(text)=>{
                       this.setState({search:text})
                   }}/>
                   <TouchableOpacity style={styles.SearchButton}
                   onPress={()=>{this.searchTransaction(this.state.search)}}>
                       <Text>Search</Text>
                   </TouchableOpacity>
                
               </View>
               <FlatList
               data={this.state.allTransactions}
               renderItem={({item})=>(
                   <View style={{borderBottomWidth:2}}>
                       <Text>{"book Id: "+item.bookId}</Text>
                       <Text>{"student Id: "+item.studentId}</Text>
                       <Text>{"Transaction Type: "+item.transactionType}</Text>
                       </View>
               )}
               keyExtractor={(item,index)=>index.toString()}
               onEndReached={this.fetchMoreTransactions}
               onEndReachedThreshold={0.7}/>
           </View>
        )
    }
} 
const styles=StyleSheet.create({
    container:{
        flex:1,
        marginTop:20
    },
    searchBar:{
        flexDirection:'row',
        height:40,
        width:'auto',
        borderWidth:0.5,
        alignItems:'center',
        backgroundColor:'grey'
    },
    bar:{
        borderWidth:2,
        height:30,
        width:300,
        paddingLeft:10
    },
    SearchButton:{
        borderWidth:1,
        height:30,
        width:50,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'green'
    }
})



