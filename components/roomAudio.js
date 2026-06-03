import { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import MaterialCommunityIcon from '@expo/vector-icons/MaterialCommunityIcons';
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
}from 'react-native-agora';

import {AGORA_APP_ID} from '@env';

const APP_ID = process.env.AGORA_APP_ID;
const AGORA_TOKEN = null;

export function RoomAudio({ roomId, userId, isInRoom }) {
  const [isMicOn, setIsMicOn]         = useState(false);
  const [isJoined, setIsJoined]       = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const engineRef                     = useRef(null);

  useEffect(() => {
    if (!isInRoom || !roomId || !userId) {
        return
    };
    setupAgora();
    return () => {
      leaveChannel();
    };
  }, []);

  const setupAgora = async () => {
    try {
      // Request microphone permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission', 'Microphone permission is required for voice chat.');
          return;
        }
      }

      // Create the Agora engine
      // This is the main object that controls everything
      const engine = createAgoraRtcEngine();
      await engine.initialize({appId: APP_ID});
      engineRef.current = engine;

      // Set to audio only — no video
      await engine.disableVideo();
      await engine.enableAudio();

      // LiveBroadcasting profile allows multiple people
      // to speak and listen simultaneously
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

      // Broadcaster means this user can both speak and listen
      // Audience means listen only — we want Broadcaster
      await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection,elapsed) => {
          setIsJoined(true);
        },
        onUserJoined: (connection,remoteUid,elapsed) => {
          setMemberCount(prev => prev + 1);
        },
        onUserOffline: (connection,remoteUid,elapsed) => {
          setMemberCount(prev => Math.max(0, prev - 1));
        },
        onError: (err,msg) => {
          console.error('Agora error:', err, msg);
        },
      });

      await engine.joinChannel(null, roomId, 0,{
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true, //start transmitting audio immediately
        autoSubscribeAudio:true, // hear other users immidiataly
      });

      // Start muted by default — user presses button to speak
      await engine.muteLocalAudioStream(true);

    } catch (err) {
      console.error('Agora setup error:', err);
      Alert.alert('Voice Error', 'Could not connect to voice room.');
    }
  };

  const leaveChannel = async () => {
    
    if (engineRef.current) {
      await engineRef.current.leaveChannel();
      engineRef.current.removeAllListeners();
      await engineRef.current.release();
      engineRef.current = null;
      setIsJoined(false);
      setIsMicOn(false);
    }
  };

  const toggleMic = async () => {
    if (!engineRef.current || !isJoined) return;
    try {
      const newMicState = !isMicOn;
      // false = unmute (speak), true = mute (silent)
      await engineRef.current.muteLocalAudioStream(!newMicState);
      setIsMicOn(newMicState);
    } catch (err) {
      console.error('Mic toggle error:', err);
    }
  };

  return (
    <View style={styles.container}>
      {isJoined && memberCount > 0 && (
        <View style={styles.countBadge}>
          <MaterialCommunityIcon name="account-voice" size={12} color="#fff" />
          <Text style={styles.countText}>{memberCount + 1}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.micButton,
          isMicOn && styles.micButtonActive,
          !isJoined && styles.micButtonDisabled,
        ]}
        onPress={() => {
            toggleMic();
        }}
        disabled={false}
      >
        <MaterialCommunityIcon
          name={isMicOn ? 'microphone' : 'microphone-off'}
          size={22}
          color={isMicOn ? '#fff' : '#1A1F2B'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  micButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: '#00C6FF',
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});