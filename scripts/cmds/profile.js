const { getText } = require('../../utils/language');

/**
 * أمر الحصول على معلومات الملف الشخصي
 * Profile Information Command
 */

module.exports = {
    config: {
        name: "profile",
        aliases: ["p", "user", "info"],
        version: "1.0.0",
        author: "Instagram Bot Framework",
        countDown: 10,
        role: 0, // 0: everyone, 1: admin, 2: dev
        description: {
            ar: "عرض معلومات الملف الشخصي لمستخدم Instagram",
            en: "Display Instagram user profile information"
        },
        category: "instagram",
        guide: {
            ar: "{prefix}profile @username أو {prefix}profile [username]",
            en: "{prefix}profile @username or {prefix}profile [username]"
        }
    },

    langs: {
        ar: {
            invalidUsername: "اسم المستخدم غير صحيح",
            profileNotFound: "الملف الشخصي غير موجود",
            profilePrivate: "الملف الشخصي خاص ولا يمكن الوصول إليه",
            error: "حدث خطأ أثناء جلب معلومات الملف الشخصي: %1",
            profileInfo: "📱 معلومات الملف الشخصي\n\n" +
                        "👤 الاسم: %1\n" +
                        "📝 اسم المستخدم: @%2\n" +
                        "📊 المتابعون: %3\n" +
                        "👥 يتابع: %4\n" +
                        "📷 المنشورات: %5\n" +
                        "🔒 خاص: %6\n" +
                        "✅ محقق: %7\n" +
                        "📄 البايو: %8"
        },
        en: {
            invalidUsername: "Invalid username",
            profileNotFound: "Profile not found",
            profilePrivate: "Profile is private and cannot be accessed",
            error: "Error occurred while fetching profile information: %1",
            profileInfo: "📱 Profile Information\n\n" +
                        "👤 Name: %1\n" +
                        "📝 Username: @%2\n" +
                        "📊 Followers: %3\n" +
                        "👥 Following: %4\n" +
                        "📷 Posts: %5\n" +
                        "🔒 Private: %6\n" +
                        "✅ Verified: %7\n" +
                        "📄 Bio: %8"
        }
    },

    onStart: async function({ message, args, getLang, prefix, instagramAPI, userModel }) {
        try {
            if (args.length === 0) {
                return message.reply(getLang("invalidUsername"));
            }

            let username = args[0];
            
            // إزالة @ إذا كانت موجودة
            // Remove @ if present
            if (username.startsWith('@')) {
                username = username.substring(1);
            }

            // التحقق من صحة اسم المستخدم
            // Validate username
            if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
                return message.reply(getLang("invalidUsername"));
            }

            // الحصول على معلومات الملف الشخصي من Instagram API
            // Get profile information from Instagram API
            const profile = await instagramAPI.getUserProfile(username);
            
            if (!profile) {
                return message.reply(getLang("profileNotFound"));
            }

            if (profile.isPrivate && !profile.isFollowing) {
                return message.reply(getLang("profilePrivate"));
            }

            // تنسيق الأرقام
            // Format numbers
            const formatNumber = (num) => {
                if (num >= 1000000) {
                    return (num / 1000000).toFixed(1) + 'M';
                } else if (num >= 1000) {
                    return (num / 1000).toFixed(1) + 'K';
                }
                return num.toString();
            };

            const profileText = getLang("profileInfo",
                profile.fullName || "غير متاح",
                profile.username,
                formatNumber(profile.followersCount),
                formatNumber(profile.followingCount),
                formatNumber(profile.postsCount),
                profile.isPrivate ? "نعم" : "لا",
                profile.isVerified ? "نعم" : "لا",
                profile.biography || "لا يوجد"
            );

            // حفظ بيانات المستخدم في قاعدة البيانات
            // Save user data to database
            if (userModel) {
                await userModel.createOrUpdate({
                    instagramId: profile.id,
                    username: profile.username,
                    fullName: profile.fullName,
                    followersCount: profile.followersCount,
                    followingCount: profile.followingCount,
                    postsCount: profile.postsCount,
                    isPrivate: profile.isPrivate,
                    isVerified: profile.isVerified,
                    lastUpdated: new Date()
                });
            }

            return message.reply(profileText);

        } catch (error) {
            console.error('Profile command error:', error);
            return message.reply(getLang("error", error.message));
        }
    },

    onReply: async function({ message, Reply, getLang, instagramAPI }) {
        try {
            // معالجة الردود إذا لزم الأمر
            // Handle replies if needed
            if (Reply.type === "profile_menu") {
                const choice = message.body;
                
                switch (choice) {
                    case "1":
                        // عرض المنشورات الأخيرة
                        // Show recent posts
                        const posts = await instagramAPI.getUserPosts(Reply.username, 5);
                        // ... معالجة عرض المنشورات
                        break;
                    case "2":
                        // عرض القصص
                        // Show stories
                        const stories = await instagramAPI.getUserStories(Reply.username);
                        // ... معالجة عرض القصص
                        break;
                    default:
                        return message.reply("خيار غير صحيح");
                }
            }
        } catch (error) {
            console.error('Profile reply error:', error);
            return message.reply(getLang("error", error.message));
        }
    }
};