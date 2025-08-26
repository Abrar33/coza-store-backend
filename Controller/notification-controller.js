const Notification = require('../Models/notifications.model');
const { firestore, FieldValue } = require('../Config/firebaseAdmin');

// Create notification

const createNotification = async ({
  title,
  message,
   type,// Set default values to null to prevent 'undefined'
  productId = null,
  senderId = null,
  recipientId = null,
  recipientRole,
  meta,
}) => {
  try {
    // Save in MongoDB
    const notificationDoc = new Notification({
      title,
      message,
      type,
      product: productId,
      sender: senderId,
      recipientId,
      recipientRole,
      meta,
      seen: false,
    });
    await notificationDoc.save();

    // Save in Firestore
    const firestoreData = {
      title,
      message,
      type,
      // Now we can use the variables directly
      productId: productId ? productId.toString() : null,
      senderId: senderId ? senderId.toString() : null,
      recipientId: recipientId ? recipientId.toString() : null,
      recipientRole,
      seen: false,
      createdAt: FieldValue.serverTimestamp(),
      mongoId: notificationDoc._id.toString(),
    };

    if (meta !== undefined) firestoreData.meta = meta;

    const fsDocRef = await firestore.collection('notifications').add(firestoreData);

    // Update Mongo with Firestore ID
    notificationDoc.firestoreId = fsDocRef.id;
    await notificationDoc.save();

    return notificationDoc;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for logged in user
const getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const role = req.user.role;

    const query = role === 'admin'
      ? { recipientRole: 'admin' }
      : { recipientId: userId };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Format response with id and firestoreId
    const formatted = notifications.map(n => ({
      ...n,
      id: n._id.toString(),
      firestoreId: n.firestoreId || null,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error });
  }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
  const notifId = req.params.id;

  try {
    // Support both Mongo _id and Firestore ID lookup
    let notification = null;
    if (notifId.match(/^[0-9a-fA-F]{24}$/)) {
      notification = await Notification.findById(notifId);
    }
    if (!notification) {
      notification = await Notification.findOne({ firestoreId: notifId });
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
    }

    const userId = req.user.id.toString();
    if (notification.recipientId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    notification.seen = true;
    await notification.save();

    if (notification.firestoreId) {
      await firestore.collection('notifications').doc(notification.firestoreId).update({ seen: true });
    }

    res.json({ message: 'Notification marked as read in both MongoDB & Firestore' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  const userId = req.user.id.toString();

  try {
    const notifications = await Notification.find({ recipientId: userId, seen: false });

    await Notification.updateMany({ recipientId: userId, seen: false }, { $set: { seen: true } });

    const batch = firestore.batch();
    notifications.forEach(n => {
      if (n.firestoreId) {
        const docRef = firestore.collection('notifications').doc(n.firestoreId);
        batch.update(docRef, { seen: true });
      }
    });
    await batch.commit();

    res.json({ message: 'All notifications marked as read in both MongoDB & Firestore' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    let notification = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      notification = await Notification.findById(id);
    }
    if (!notification) {
      notification = await Notification.findOne({ firestoreId: id });
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
    }

    const userId = req.user.id.toString();
    if (notification.recipientId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (notification.firestoreId) {
      await firestore.collection('notifications').doc(notification.firestoreId).delete();
    }

    await Notification.findByIdAndDelete(notification._id);

    res.json({ message: 'Notification deleted from both MongoDB & Firestore' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};


module.exports = {
  createNotification,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
