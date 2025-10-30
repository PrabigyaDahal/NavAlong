
const BASE_URL = 'http://192.168.33.58:8081';

export const generateOtp = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/group/create` , {
            method : "POST"
        });

        if(!response.ok){
            throw new Error ("Failed to generate new OTP")
        }

        const data = await response.text();
        return data;

    }catch (error) {
        console.error("Error generating OTP:", error);
        throw error;
    }
};