import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/explore";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

type UserResult = {
  _id: Id<"users">;
  username: string;
  fullname: string;
  image: string;
  followers: number;
  isFollowing: boolean;
};

export function UserResultItem({
  user,
  onFollowToggle,
}: {
  user: UserResult;
  onFollowToggle: (userId: Id<"users">) => void;
}) {
  return (
    <Link href={`/user/${user._id}`} asChild>
      <TouchableOpacity style={styles.userItem}>
        <Image
          source={user.image}
          style={styles.userAvatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userUsername}>@{user.username}</Text>
          <Text style={styles.userFullname}>{user.fullname}</Text>
          <Text style={styles.userFollowers}>{user.followers} followers</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            user.isFollowing && styles.followingButton,
          ]}
          onPress={() => onFollowToggle(user._id)}
        >
          <Text
            style={[
              styles.followButtonText,
              user.isFollowing && styles.followingButtonText,
            ]}
          >
            {user.isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Link>
  );
}
