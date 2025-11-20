import BlogPostModel from '@models/BlogPost.model';
import CertificateModel from '@models/Certificate.model';
import ContactMessageModel from '@models/ContactMessage.model';
import NewsletterSubscriberModel from '@models/NewsletterSubscriber.model';
import ProjectModel from '@models/Project.model';
import TestimonialModel from '@models/Testimonial.model';
import UserModel from '@models/User.model';
import { fetchRecentActivity } from '@services/activityLog.service';

export const getAdminMetrics = async () => {
  const [
    projectCount,
    certificateCount,
    blogCount,
    subscriberCount,
    testimonialCount,
    pendingContacts,
    userCount,
    recentActivity
  ] = await Promise.all([
    ProjectModel.countDocuments(),
    CertificateModel.countDocuments(),
    BlogPostModel.countDocuments({ published: true }),
    NewsletterSubscriberModel.countDocuments({ isConfirmed: true, unsubscribedAt: { $exists: false } }),
    TestimonialModel.countDocuments({ isApproved: true }),
    ContactMessageModel.countDocuments({ status: { $ne: 'resolved' } }),
    UserModel.countDocuments(),
    fetchRecentActivity(15)
  ]);

  return {
    totals: {
      projects: projectCount,
      certificates: certificateCount,
      blogPosts: blogCount,
      subscribers: subscriberCount,
      testimonials: testimonialCount,
      activeUsers: userCount,
      pendingContacts
    },
    recentActivity
  };
};
