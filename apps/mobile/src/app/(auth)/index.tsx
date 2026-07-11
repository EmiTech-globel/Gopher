import { View, Text, StyleSheet } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Gopher</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#532B59",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: "Ubuntu",
    fontSize: 40,
    color: "#D7AEAD",
    fontWeight: "700",
  },
});
