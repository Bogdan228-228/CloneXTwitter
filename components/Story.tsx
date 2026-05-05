import { styles } from "@/styles/feed.styles";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";

export default function Story({ story }: { story: any }) {
  return (
    <TouchableOpacity style={styles.storyWrapper}>
      <View style={[styles.storyRing, !story.hasStory && styles.noStory]}>
        <Image source={story.avatar} style={styles.storyAvatar} />
      </View>
      <Text style={styles.storyUsername}>{story.username}</Text>
    </TouchableOpacity>
  );
}
