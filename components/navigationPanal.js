import {View, Text, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const getDirectionIcon = (maneuver) => {
    switch (maneuver) {
        case "turn-left":
        case "sharp-left":
        case "slight-left":
            return "arrow-top-left";

        case "turn-right":
        case "sharp-right":
        case "slight-right":
            return "arrow-top-right";

        case "straight":
        case "keep-left":
        case "keep-right":
            return "arrow-up";

        case "roundabout-left":
        case "roundabout-right":
            return "rotate-right";
        
        case "uturn-left":
        case "uturn-right":
            return "u-turn-right";
        
        case "merge":
            return "merge";

        case "fork-left":
        case "fork-right":
            return "arrow-split-vertical";
        
        case "ramp-left":
        case "ramp-right":
            return "arrow-top-right";

        default:
            return "arrow-up";
    }
}

const stripHtml = (html) => {
    return html
        ?.replace(/<b>/g,"")
        .replace(/<b>/g,"")
        .replace(/<div[^>]*>/g," ")
        .replace(/<\/div>/g," ")
        .replace(/<[^>]*>/g,"")
        .trim() ?? "";
}

export function NavigationPanal({currentStep, nextStep, totalStep, stepIndex}){
    if(!currentStep) return null;

    const instructions = stripHtml(currentStep.html_instruction);
    const nextInstruction= nextStep ? stripHtml(nextStep.html_instruction) : null;
    const maneuver = currentStep.maneuver ?? "straight";
    const distance = currentStep.distance?.text ?? "";
    const isLastStep = stepIndex === totalStep -1;

    return (
        <View style = {styles.container}>
            
            {/*Main Instruction */}
            <View style = {styles.mainRow}>
                
                {/*Direction Icon*/} 
                <View styles = {styles.iconBox}>
                    <MaterialCommunityIcons 
                        name={getDirectionIcon(maneuver)}
                        size={32}
                        color = "#fff"
                    />
                </View>

                {/*Instruction Text*/}
                <View style = {styles.textBox}>
                    <Text style = {styles.instruction} numberOfLines = {2}>
                        {instructions}
                    </Text>
                    <Text style = {styles.distance}>{distance}</Text>
                </View>
            </View>

            {/* Divider */}
            <View style = {styles.divider} />

            {/*next step instruction */}
            <View style = {styles.nextRow}>
                <MaterialCommunityIcons
                    name = "chevron-right"
                    size = {16}
                    color = "rgba(255,255,255,0.5)" 
                />
                <Text styles = {styles.nextLabel}>
                    {isLastStep 
                    ? "You have arrived at your destination" 
                    : nextInstruction
                    ? `Then,m ${nextInstruction}`
                    : "Arrived at destination"                   
                    }
                </Text>
            </View>
        </View>

    )}

    const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 80,
        left: 0,
        right: 0,
        backgroundColor: "#1A1F2B",
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },

    // Main instruction row
    mainRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 12,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: "#00C6FF",
        justifyContent: "center",
        alignItems: "center",
    },
    textBox: {
        flex: 1,
    },
    instruction: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        lineHeight: 24,
    },
    distance: {
        fontSize: 14,
        color: "rgba(255,255,255,0.6)",
        marginTop: 4,
        fontWeight: "500",
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginBottom: 10,
    },

    // Next step
    nextRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
    },
    nextLabel: {
        fontSize: 13,
        color: "rgba(255,255,255,0.5)",
        flex: 1,
    },

    // Step progress dots
    progressRow: {
        flexDirection: "row",
        gap: 4,
        flexWrap: "wrap",
    },
    progressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    progressDotActive: {
        backgroundColor: "#00C6FF",
        width: 18,
    },
    progressDotDone: {
        backgroundColor: "rgba(0,198,255,0.4)",
    },
});