/**
 * مكتبة تكامل Instagram
 * Instagram Integration Library
 * 
 * تحذير: هذه المكتبة للأغراض التعليمية فقط
 * Warning: This library is for educational purposes only
 */

const logger = require('../core/logger');
const Helpers = require('./helpers');

/**
 * فئة تكامل Instagram
 * Instagram Integration Class
 */
class InstagramIntegration {
    constructor() {
        this.session = null;
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        this.baseURL = 'https://www.instagram.com';
        this.apiURL = 'https://i.instagram.com/api/v1';
        this.requestDelay = 2000; // تأخير بين الطلبات - Delay between requests
        this.maxRetries = 3;
    }

    /**
     * تهيئة الجلسة بالكوكيز
     * Initialize session with cookies
     * @param {Object} cookies - الكوكيز
     * @returns {boolean} - نجاح التهيئة
     */
    async initializeSession(cookies) {
        try {
            logger.info('تهيئة جلسة Instagram - Initializing Instagram session...');

            // التحقق من صحة الكوكيز - Validate cookies
            if (!this.validateCookies(cookies)) {
                throw new Error('كوكيز غير صحيحة - Invalid cookies');
            }

            this.session = {
                cookies: cookies,
                headers: {
                    'User-Agent': this.userAgent,
                    'X-CSRFToken': cookies.csrftoken,
                    'X-Instagram-AJAX': '1',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': this.baseURL + '/',
                    'Cookie': this.formatCookies(cookies)
                },
                isValid: true,
                createdAt: new Date()
            };

            // التحقق من صحة الجلسة - Validate session
            const isValid = await this.validateSession();
            
            if (!isValid) {
                this.session = null;
                throw new Error('فشل في التحقق من الجلسة - Session validation failed');
            }

            logger.info('تم تهيئة جلسة Instagram بنجاح - Instagram session initialized successfully');
            return true;

        } catch (error) {
            logger.error('فشل في تهيئة جلسة Instagram - Failed to initialize Instagram session:', error);
            return false;
        }
    }

    /**
     * التحقق من صحة الكوكيز
     * Validate cookies
     * @param {Object} cookies - الكوكيز
     * @returns {boolean} - هل الكوكيز صحيحة؟
     */
    validateCookies(cookies) {
        const requiredCookies = ['sessionid', 'csrftoken'];
        
        for (const cookie of requiredCookies) {
            if (!cookies[cookie] || typeof cookies[cookie] !== 'string') {
                logger.warn(`كوكي مطلوب مفقود - Missing required cookie: ${cookie}`);
                return false;
            }
        }

        return true;
    }

    /**
     * تنسيق الكوكيز للطلبات
     * Format cookies for requests
     * @param {Object} cookies - الكوكيز
     * @returns {string} - الكوكيز منسقة
     */
    formatCookies(cookies) {
        return Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
    }

    /**
     * التحقق من صحة الجلسة
     * Validate session
     * @returns {boolean} - هل الجلسة صحيحة؟
     */
    async validateSession() {
        try {
            if (!this.session) {
                return false;
            }

            // محاولة الوصول لصفحة الملف الشخصي - Try to access profile page
            const response = await this.makeRequest('/accounts/edit/', 'GET');
            
            return response && response.status !== 'fail';

        } catch (error) {
            logger.error('فشل في التحقق من الجلسة - Session validation failed:', error);
            return false;
        }
    }

    /**
     * إجراء طلب HTTP
     * Make HTTP request
     * @param {string} endpoint - النقطة النهائية
     * @param {string} method - نوع الطلب
     * @param {Object} data - البيانات
     * @returns {Object} - الاستجابة
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        if (!this.session) {
            throw new Error('لا توجد جلسة نشطة - No active session');
        }

        const url = endpoint.startsWith('http') ? endpoint : this.apiURL + endpoint;
        
        const options = {
            method: method,
            headers: { ...this.session.headers }
        };

        if (data && method !== 'GET') {
            if (data instanceof FormData) {
                options.body = data;
                // لا تعيين Content-Type للـ FormData - Don't set Content-Type for FormData
                delete options.headers['Content-Type'];
            } else {
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                options.body = new URLSearchParams(data).toString();
            }
        }

        try {
            // تأخير الطلب - Request delay
            await Helpers.delay(this.requestDelay);

            // محاكاة الطلب (في بيئة حقيقية استخدم fetch أو axios)
            // Simulate request (in real environment use fetch or axios)
            logger.debug(`Instagram API Request: ${method} ${url}`);
            
            // إرجاع استجابة مُحاكاة - Return simulated response
            return this.simulateResponse(endpoint, method, data);

        } catch (error) {
            logger.error(`فشل طلب Instagram API - Instagram API request failed: ${method} ${url}`, error);
            throw error;
        }
    }

    /**
     * محاكاة الاستجابة (للأغراض التعليمية)
     * Simulate response (for educational purposes)
     * @param {string} endpoint - النقطة النهائية
     * @param {string} method - نوع الطلب
     * @param {Object} data - البيانات
     * @returns {Object} - الاستجابة المُحاكاة
     */
    simulateResponse(endpoint, method, data) {
        // هذه دالة محاكاة - للاستخدام الحقيقي يجب استبدالها بطلبات HTTP حقيقية
        // This is a simulation function - for real use, replace with actual HTTP requests
        
        const responses = {
            '/accounts/edit/': {
                status: 'ok',
                user: {
                    username: 'test_user',
                    full_name: 'Test User',
                    biography: 'Test bio',
                    is_private: false
                }
            },
            '/users/web_profile_info/': {
                status: 'ok',
                data: {
                    user: {
                        id: '123456789',
                        username: 'test_user',
                        full_name: 'Test User',
                        follower_count: 1000,
                        following_count: 500,
                        is_verified: false,
                        is_private: false
                    }
                }
            },
            '/direct_v2/inbox/': {
                status: 'ok',
                inbox: {
                    threads: []
                }
            }
        };

        return responses[endpoint] || { status: 'ok', message: 'simulated response' };
    }

    /**
     * الحصول على معلومات المستخدم
     * Get user information
     * @param {string} username - اسم المستخدم
     * @returns {Object} - معلومات المستخدم
     */
    async getUserInfo(username) {
        try {
            logger.debug(`جلب معلومات المستخدم - Fetching user info: ${username}`);

            const response = await this.makeRequest(`/users/web_profile_info/?username=${username}`, 'GET');
            
            if (response.status === 'ok' && response.data) {
                const user = response.data.user;
                
                return {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    biography: user.biography || '',
                    followerCount: user.follower_count || 0,
                    followingCount: user.following_count || 0,
                    postCount: user.media_count || 0,
                    isVerified: user.is_verified || false,
                    isPrivate: user.is_private || false,
                    profilePicUrl: user.profile_pic_url || '',
                    externalUrl: user.external_url || '',
                    isBusinessAccount: user.is_business_account || false
                };
            }

            throw new Error('فشل في جلب معلومات المستخدم - Failed to fetch user info');

        } catch (error) {
            logger.error(`فشل في جلب معلومات المستخدم - Failed to get user info for ${username}:`, error);
            throw error;
        }
    }

    /**
     * الحصول على قائمة المحادثات
     * Get conversations list
     * @returns {Array} - قائمة المحادثات
     */
    async getConversations() {
        try {
            logger.debug('جلب قائمة المحادثات - Fetching conversations list');

            const response = await this.makeRequest('/direct_v2/inbox/', 'GET');
            
            if (response.status === 'ok' && response.inbox) {
                return response.inbox.threads.map(thread => ({
                    threadId: thread.thread_id,
                    users: thread.users.map(user => ({
                        id: user.pk,
                        username: user.username,
                        fullName: user.full_name,
                        profilePicUrl: user.profile_pic_url
                    })),
                    lastMessage: thread.items[0] ? {
                        id: thread.items[0].item_id,
                        text: thread.items[0].text || '',
                        timestamp: new Date(thread.items[0].timestamp / 1000),
                        userId: thread.items[0].user_id
                    } : null,
                    isGroup: thread.is_group,
                    muted: thread.muted,
                    unreadCount: thread.unread_count || 0
                }));
            }

            return [];

        } catch (error) {
            logger.error('فشل في جلب المحادثات - Failed to get conversations:', error);
            return [];
        }
    }

    /**
     * الحصول على رسائل محادثة معينة
     * Get messages from specific conversation
     * @param {string} threadId - معرف المحادثة
     * @param {string} cursor - مؤشر للتصفح
     * @returns {Array} - قائمة الرسائل
     */
    async getMessages(threadId, cursor = null) {
        try {
            logger.debug(`جلب رسائل المحادثة - Fetching messages for thread: ${threadId}`);

            let endpoint = `/direct_v2/threads/${threadId}/`;
            if (cursor) {
                endpoint += `?cursor=${cursor}`;
            }

            const response = await this.makeRequest(endpoint, 'GET');
            
            if (response.status === 'ok' && response.thread) {
                return response.thread.items.map(item => ({
                    id: item.item_id,
                    text: item.text || '',
                    timestamp: new Date(item.timestamp / 1000),
                    userId: item.user_id,
                    type: item.item_type,
                    media: item.media ? {
                        type: item.media.media_type,
                        url: item.media.image_versions2?.candidates[0]?.url
                    } : null
                }));
            }

            return [];

        } catch (error) {
            logger.error(`فشل في جلب رسائل المحادثة - Failed to get messages for thread ${threadId}:`, error);
            return [];
        }
    }

    /**
     * إرسال رسالة مباشرة محدثة مع دعم الميزات الجديدة
     * Enhanced direct message sending with new features
     * @param {string} userId - معرف المستخدم
     * @param {string} message - نص الرسالة
     * @param {Object} options - خيارات إضافية
     * @returns {Object} - نتيجة الإرسال
     */
    async sendDirectMessage(userId, message, options = {}) {
        try {
            logger.info(`إرسال رسالة مباشرة - Sending direct message to: ${userId}`);

            const {
                media = null,
                replyToMessageId = null,
                mentionUsers = [],
                buttons = null,
                threadId = null,
                enableReactions = true
            } = options;

            // التحقق من صحة المدخلات - Validate inputs
            if (!userId || (!message && !media)) {
                throw new Error('معرف المستخدم والرسالة أو الوسائط مطلوبان - User ID and message or media are required');
            }

            if (message && message.length > 1000) {
                throw new Error('الرسالة طويلة جداً - Message too long');
            }

            let data = {
                recipient_users: `[${userId}]`,
                thread_ids: threadId ? `[${threadId}]` : '[]',
                action: 'send_item'
            };

            // إضافة النص إذا وجد
            if (message) {
                data.text = message;
            }

            // إضافة الوسائط إذا وجدت
            if (media) {
                await this.addMediaToMessage(data, media);
            }

            // إضافة معلومات الرد إذا وجدت
            if (replyToMessageId) {
                data.replied_to_item_id = replyToMessageId;
            }

            // إضافة الإشارات إذا وجدت
            if (mentionUsers.length > 0) {
                data.mentioned_users = JSON.stringify(mentionUsers);
            }

            const response = await this.makeRequest('/direct_v2/threads/broadcast/text/', 'POST', data);
            
            if (response.status === 'ok') {
                logger.info(`تم إرسال الرسالة بنجاح - Message sent successfully to: ${userId}`);
                
                const result = {
                    success: true,
                    messageId: response.item_id || Date.now().toString(),
                    timestamp: new Date(),
                    threadId: response.thread_id || threadId,
                    hasMedia: !!media,
                    isReply: !!replyToMessageId,
                    enableReactions
                };

                // إضافة الأزرار إذا وجدت
                if (buttons) {
                    result.buttons = buttons;
                    result.hasButtons = true;
                }

                return result;
            }

            throw new Error('فشل في إرسال الرسالة - Failed to send message');

        } catch (error) {
            logger.error(`فشل في إرسال الرسالة - Failed to send message to ${userId}:`, error);
            throw error;
        }
    }

    /**
     * إضافة وسائط للرسالة
     * Add media to message
     * @param {Object} data - بيانات الرسالة
     * @param {Object} media - الوسائط
     */
    async addMediaToMessage(data, media) {
        switch (media.type) {
            case 'image':
                data.media_type = 'photo';
                if (media.url) {
                    data.photo_url = media.url;
                } else if (media.filePath) {
                    data.upload_id = Date.now().toString();
                }
                break;

            case 'video':
                data.media_type = 'video';
                if (media.url) {
                    data.video_url = media.url;
                } else if (media.filePath) {
                    data.upload_id = Date.now().toString();
                }
                break;

            case 'audio':
                data.media_type = 'voice';
                if (media.filePath) {
                    data.upload_id = Date.now().toString();
                }
                break;

            case 'document':
                data.media_type = 'document';
                if (media.filePath) {
                    data.upload_id = Date.now().toString();
                    data.file_name = media.fileName;
                }
                break;
        }
    }

    /**
     * إرسال صورة
     * Send image
     * @param {string} userId - معرف المستخدم
     * @param {Object} image - بيانات الصورة
     * @param {string} caption - التعليق
     * @returns {Object} - نتيجة الإرسال
     */
    async sendImage(userId, image, caption = '') {
        return await this.sendDirectMessage(userId, caption, {
            media: { type: 'image', ...image }
        });
    }

    /**
     * إرسال فيديو
     * Send video
     * @param {string} userId - معرف المستخدم
     * @param {Object} video - بيانات الفيديو
     * @param {string} caption - التعليق
     * @returns {Object} - نتيجة الإرسال
     */
    async sendVideo(userId, video, caption = '') {
        return await this.sendDirectMessage(userId, caption, {
            media: { type: 'video', ...video }
        });
    }

    /**
     * إرسال صوت
     * Send audio
     * @param {string} userId - معرف المستخدم
     * @param {Object} audio - بيانات الصوت
     * @returns {Object} - نتيجة الإرسال
     */
    async sendAudio(userId, audio) {
        return await this.sendDirectMessage(userId, '', {
            media: { type: 'audio', ...audio }
        });
    }

    /**
     * إرسال مستند
     * Send document
     * @param {string} userId - معرف المستخدم
     * @param {Object} document - بيانات المستند
     * @returns {Object} - نتيجة الإرسال
     */
    async sendDocument(userId, document) {
        return await this.sendDirectMessage(userId, '', {
            media: { type: 'document', ...document }
        });
    }

    /**
     * إضافة تفاعل على رسالة
     * Add reaction to message
     * @param {string} messageId - معرف الرسالة
     * @param {string} reactionType - نوع التفاعل
     * @returns {Object} - نتيجة التفاعل
     */
    async addMessageReaction(messageId, reactionType) {
        try {
            logger.info(`إضافة تفاعل - Adding reaction: ${reactionType} to ${messageId}`);

            const data = {
                item_id: messageId,
                reaction_type: reactionType,
                action: 'send_item'
            };

            const response = await this.makeRequest('/direct_v2/threads/broadcast/reaction/', 'POST', data);
            
            if (response.status === 'ok') {
                logger.info(`تم إضافة التفاعل بنجاح - Reaction added successfully: ${reactionType}`);
                return {
                    success: true,
                    reactionType,
                    messageId,
                    timestamp: new Date()
                };
            }

            throw new Error('فشل في إضافة التفاعل - Failed to add reaction');

        } catch (error) {
            logger.error(`فشل في إضافة التفاعل - Failed to add reaction:`, error);
            throw error;
        }
    }

    /**
     * إزالة تفاعل من رسالة
     * Remove reaction from message
     * @param {string} messageId - معرف الرسالة
     * @returns {Object} - نتيجة الإزالة
     */
    async removeMessageReaction(messageId) {
        try {
            logger.info(`إزالة تفاعل - Removing reaction from: ${messageId}`);

            const data = {
                item_id: messageId,
                action: 'send_item'
            };

            const response = await this.makeRequest('/direct_v2/threads/broadcast/reaction/', 'DELETE', data);
            
            if (response.status === 'ok') {
                logger.info('تم إزالة التفاعل بنجاح - Reaction removed successfully');
                return {
                    success: true,
                    messageId,
                    timestamp: new Date()
                };
            }

            throw new Error('فشل في إزالة التفاعل - Failed to remove reaction');

        } catch (error) {
            logger.error('فشل في إزالة التفاعل - Failed to remove reaction:', error);
            throw error;
        }
    }

    /**
     * الإعجاب بمنشور
     * Like a post
     * @param {string} postId - معرف المنشور
     * @returns {boolean} - نجاح العملية
     */
    async likePost(postId) {
        try {
            logger.debug(`الإعجاب بالمنشور - Liking post: ${postId}`);

            const response = await this.makeRequest(`/web/likes/${postId}/like/`, 'POST');
            
            if (response.status === 'ok') {
                logger.debug(`تم الإعجاب بالمنشور - Post liked successfully: ${postId}`);
                return true;
            }

            return false;

        } catch (error) {
            logger.error(`فشل في الإعجاب بالمنشور - Failed to like post ${postId}:`, error);
            return false;
        }
    }

    /**
     * إلغاء الإعجاب بمنشور
     * Unlike a post
     * @param {string} postId - معرف المنشور
     * @returns {boolean} - نجاح العملية
     */
    async unlikePost(postId) {
        try {
            logger.debug(`إلغاء الإعجاب بالمنشور - Unliking post: ${postId}`);

            const response = await this.makeRequest(`/web/likes/${postId}/unlike/`, 'POST');
            
            if (response.status === 'ok') {
                logger.debug(`تم إلغاء الإعجاب بالمنشور - Post unliked successfully: ${postId}`);
                return true;
            }

            return false;

        } catch (error) {
            logger.error(`فشل في إلغاء الإعجاب بالمنشور - Failed to unlike post ${postId}:`, error);
            return false;
        }
    }

    /**
     * التعليق على منشور
     * Comment on a post
     * @param {string} postId - معرف المنشور
     * @param {string} comment - نص التعليق
     * @returns {Object} - نتيجة التعليق
     */
    async commentOnPost(postId, comment) {
        try {
            logger.debug(`التعليق على المنشور - Commenting on post: ${postId}`);

            if (!comment || comment.length > 2200) {
                throw new Error('تعليق غير صحيح - Invalid comment');
            }

            const data = {
                comment_text: comment
            };

            const response = await this.makeRequest(`/web/comments/${postId}/add/`, 'POST', data);
            
            if (response.status === 'ok') {
                logger.debug(`تم التعليق على المنشور - Comment added successfully: ${postId}`);
                
                return {
                    success: true,
                    commentId: response.id || Date.now().toString(),
                    timestamp: new Date()
                };
            }

            throw new Error('فشل في إضافة التعليق - Failed to add comment');

        } catch (error) {
            logger.error(`فشل في التعليق على المنشور - Failed to comment on post ${postId}:`, error);
            throw error;
        }
    }

    /**
     * متابعة مستخدم
     * Follow a user
     * @param {string} userId - معرف المستخدم
     * @returns {boolean} - نجاح العملية
     */
    async followUser(userId) {
        try {
            logger.debug(`متابعة المستخدم - Following user: ${userId}`);

            const response = await this.makeRequest(`/web/friendships/${userId}/follow/`, 'POST');
            
            if (response.status === 'ok') {
                logger.info(`تم متابعة المستخدم - User followed successfully: ${userId}`);
                return true;
            }

            return false;

        } catch (error) {
            logger.error(`فشل في متابعة المستخدم - Failed to follow user ${userId}:`, error);
            return false;
        }
    }

    /**
     * إلغاء متابعة مستخدم
     * Unfollow a user
     * @param {string} userId - معرف المستخدم
     * @returns {boolean} - نجاح العملية
     */
    async unfollowUser(userId) {
        try {
            logger.debug(`إلغاء متابعة المستخدم - Unfollowing user: ${userId}`);

            const response = await this.makeRequest(`/web/friendships/${userId}/unfollow/`, 'POST');
            
            if (response.status === 'ok') {
                logger.info(`تم إلغاء متابعة المستخدم - User unfollowed successfully: ${userId}`);
                return true;
            }

            return false;

        } catch (error) {
            logger.error(`فشل في إلغاء متابعة المستخدم - Failed to unfollow user ${userId}:`, error);
            return false;
        }
    }

    /**
     * الحصول على قائمة المتابعين
     * Get followers list
     * @param {string} userId - معرف المستخدم
     * @param {number} count - عدد المتابعين المطلوب
     * @returns {Array} - قائمة المتابعين
     */
    async getFollowers(userId, count = 50) {
        try {
            logger.debug(`جلب المتابعين - Fetching followers for user: ${userId}`);

            const response = await this.makeRequest(`/friendships/${userId}/followers/?count=${count}`, 'GET');
            
            if (response.status === 'ok' && response.users) {
                return response.users.map(user => ({
                    id: user.pk,
                    username: user.username,
                    fullName: user.full_name,
                    profilePicUrl: user.profile_pic_url,
                    isVerified: user.is_verified,
                    isPrivate: user.is_private
                }));
            }

            return [];

        } catch (error) {
            logger.error(`فشل في جلب المتابعين - Failed to get followers for user ${userId}:`, error);
            return [];
        }
    }

    /**
     * الحصول على قائمة المتابَعين
     * Get following list
     * @param {string} userId - معرف المستخدم
     * @param {number} count - عدد المتابَعين المطلوب
     * @returns {Array} - قائمة المتابَعين
     */
    async getFollowing(userId, count = 50) {
        try {
            logger.debug(`جلب المتابَعين - Fetching following for user: ${userId}`);

            const response = await this.makeRequest(`/friendships/${userId}/following/?count=${count}`, 'GET');
            
            if (response.status === 'ok' && response.users) {
                return response.users.map(user => ({
                    id: user.pk,
                    username: user.username,
                    fullName: user.full_name,
                    profilePicUrl: user.profile_pic_url,
                    isVerified: user.is_verified,
                    isPrivate: user.is_private
                }));
            }

            return [];

        } catch (error) {
            logger.error(`فشل في جلب المتابَعين - Failed to get following for user ${userId}:`, error);
            return [];
        }
    }

    /**
     * البحث عن المستخدمين
     * Search for users
     * @param {string} query - مصطلح البحث
     * @param {number} count - عدد النتائج
     * @returns {Array} - نتائج البحث
     */
    async searchUsers(query, count = 20) {
        try {
            logger.debug(`البحث عن المستخدمين - Searching users: ${query}`);

            const encodedQuery = encodeURIComponent(query);
            const response = await this.makeRequest(`/users/search/?q=${encodedQuery}&count=${count}`, 'GET');
            
            if (response.status === 'ok' && response.users) {
                return response.users.map(user => ({
                    id: user.pk,
                    username: user.username,
                    fullName: user.full_name,
                    profilePicUrl: user.profile_pic_url,
                    isVerified: user.is_verified,
                    isPrivate: user.is_private,
                    followerCount: user.follower_count || 0
                }));
            }

            return [];

        } catch (error) {
            logger.error(`فشل في البحث عن المستخدمين - Failed to search users with query ${query}:`, error);
            return [];
        }
    }

    /**
     * الحصول على إحصائيات الحساب
     * Get account statistics
     * @returns {Object} - إحصائيات الحساب
     */
    async getAccountStats() {
        try {
            logger.debug('جلب إحصائيات الحساب - Fetching account statistics');

            const response = await this.makeRequest('/accounts/edit/', 'GET');
            
            if (response.status === 'ok' && response.user) {
                const user = response.user;
                
                return {
                    username: user.username,
                    fullName: user.full_name,
                    followerCount: user.follower_count || 0,
                    followingCount: user.following_count || 0,
                    postCount: user.media_count || 0,
                    isVerified: user.is_verified || false,
                    isPrivate: user.is_private || false,
                    isBusiness: user.is_business_account || false,
                    biography: user.biography || '',
                    externalUrl: user.external_url || ''
                };
            }

            throw new Error('فشل في جلب إحصائيات الحساب - Failed to fetch account stats');

        } catch (error) {
            logger.error('فشل في جلب إحصائيات الحساب - Failed to get account stats:', error);
            throw error;
        }
    }

    /**
     * تنظيف الجلسة
     * Cleanup session
     */
    cleanup() {
        this.session = null;
        logger.info('تم تنظيف جلسة Instagram - Instagram session cleaned up');
    }

    /**
     * التحقق من حالة الاتصال
     * Check connection status
     * @returns {boolean} - حالة الاتصال
     */
    isConnected() {
        return this.session !== null && this.session.isValid;
    }

    /**
     * الحصول على معلومات الجلسة
     * Get session information
     * @returns {Object} - معلومات الجلسة
     */
    getSessionInfo() {
        if (!this.session) {
            return null;
        }

        return {
            isValid: this.session.isValid,
            createdAt: this.session.createdAt,
            userAgent: this.userAgent,
            cookieCount: Object.keys(this.session.cookies).length
        };
    }
}

module.exports = InstagramIntegration;
