import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "top",
        alignItems: "center",
        backgroundColor: "#1A1F2B",
    },
    title: {
        fontSize: 50,
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "bold",
        fontFamily: "sans-serif-condensed",
        marginTop: 150,
        marginBottom: 20,
    },
    text: {
        fontSize: 40,
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "bold",
        fontFamily: "sans-serif-condensed",
        padding: 20,
        
    },
    button: {
        backgroundColor: "#00C6FF",
        color: "white",
        borderRadius: 10,
        marginTop: 40,
        width: 200,
        alignSelf: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 20,
        padding: 10,
        textAlign: "center",
        width: 200,
    },
    textArea: {
    height: 50,
    borderColor: '#ccc',
    width: '90%',
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top', // aligns text at the top in Android
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: 20, 
    marginTop: 10,
  },
  icon: {
    alignSelf: 'center',
    tintColor:"#FFFFFF",
    color: "#FFFFFF",
    marginTop: 150,
    marginBottom: 20,
  },
  digit: {
        fontSize: 30,
        color: "#FFFFFF",
        margin: 5,
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
    },
    car:{
        width:200,
        height:100,
    },
    container: { flex: 1 },
    map: {
         flex: 1 ,
         
        },
    buttonContainer: {
        position: 'absolute',
        bottom: 50,
        right: 20,
  },
});