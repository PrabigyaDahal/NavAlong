import {supabase} from "./supabase.js"

export const Write_To_DB_Interval = 30_000;

export async function createRoom(groupName,userId){

    const {data,error} = await supabase
        .from("rooms")
        .insert(
            {
                group_name : groupName,
                created_by : userId 
            }
        )
        .select("id, short_code, group_name")
        .single();

    if (error) return {data , error};

    await supabase
    .from("room_members")
    .insert({room_id : data.id , user_id : userId});
    return {data,error} ;
}

export async function joinRoom(shortCode,userId){

    const {data : room, error : roomError} = await supabase
        .from("rooms")
        .select("id, short_code, group_name,created_by")
        .eq("short_code", shortCode.toUpperCase())
        .single();

    if (roomError || !room) return {data:null, error: roomError};

    // Adding user to the created room.
    const {data : memberData, error : memberError} = await supabase
        .from("room_members")
        .upsert( // upsert instead of insert as it checks if the data already exists and avaids duplication of data.
            {room_id : room.id , user_id : userId},
            {onConflict: "room_id , user_id"}
        )
        .select();
    

    if (memberError) return {data : null , error : memberError};
    
    return { data : room , error : null};

}

export async function endRoom(roomId){

    const {error} = await supabase
        .from("rooms")
        .delete()
        .eq("id",roomId);
    
        return {error};
}

export async function getRoomMembers(roomId){
    const {data , error} = await supabase
        .from("room_members")
        .select("user_id, profiles(username, avatar_url)")
        .eq("room_id",roomId)
    
    return {data,error};
}

export async function saveLocation(userId,coords){

    const {error} = await supabase
        .from("user_locations")
        .upsert(
            {
                user_id: userId,
                latitude : coords.latitude,
                longitude : coords.longitude,
                heading: coords.heading ?? 0,
                updated_at : new Date().toISOString(),
            },
            {onConflict: "user_id"}
        );
    
    if(error) console.warn("saveLocationError: ", error.message)
        
}

export async function getLastLocation(userId){

    const {data,error} = await supabase
        .from("user_locations")
        .select("latitude, longitude, heading, updated_at")
        .eq("user_id",userId)
        .single();

    return {data , error};
}

export function subscribeToRoom(roomId,userId,onLocationUpdate,onDestinationUpdate){
    const channel = supabase.channel(`room:${roomId}`,{
        config: { broadcast : {self : false} }, //self false to block supabase from sending users own locaion
    });

    channel
        .on("broadcast" , {event: "location"}, ({payload: locUpdate}) => {
            
            if(locUpdate.userId !== userId) onLocationUpdate(locUpdate);
        }
    ) 
    .on("broadcast",{event: "destination"}, ({payload: destUpdate}) => {
        if(destUpdate.userId !== userId && onDestinationUpdate) {
            onDestinationUpdate(destUpdate);
        }
    })
    channel.subscribe((status) => {
        
    })

    return channel
    /*return channel => to trigger channel.unsucbscribe(), from LocationScreen.
        or else websocket remains open causing memory leak.
    */

}

export async function broadcastDestination(channel,userId,destination,destLabel){
    if(!channel || ! destination) return;

    await channel.send({
        type: "broadcast",
        event: "destination",
        payload: {
            userId,
            latitude: destination.latitude,
            longitude: destination.longitude,
            destLabel: destLabel ?? "",
        }
    })
}

export async function broadcastLocation(channel,userId,coords){
    
    const result = await channel.send({
        type : "broadcast",
        event: "location",
        payload: {
            userId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            heading: coords.heading ?? 0,
            timestamp: Date.now(),
        },
    });
    
}

export async function leaveRoom(roomId,userId) {
    const {error} = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);

    return {error};
}