import BlogPostModel from '@models/BlogPost.model';
import CertificateModel from '@models/Certificate.model';
import ProjectModel from '@models/Project.model';
import type { RequestAudienceContext } from '@services/audienceAccess.service';
import {
  buildAccessDescriptor,
  normalizeVisibleToSegments
} from '@services/audienceAccess.service';

interface SearchResult<T> {
  type: 'project' | 'certificate' | 'blog';
  items: T[];
}

export const searchContent = async (
  term: string,
  limit: number,
  context: Pick<RequestAudienceContext, 'viewerSegment' | 'isAdminBypass'>
) => {
  const regex = new RegExp(term, 'i');

  const [projects, certificates, posts] = await Promise.all([
    ProjectModel.find({ $or: [{ title: regex }, { description: regex }, { technologies: regex }] })
      .limit(limit)
      .select('title slug description technologies heroImage featured level category visibleToSegments'),
    CertificateModel.find({ $or: [{ title: regex }, { issuer: regex }, { skills: regex }] })
      .limit(limit)
      .select('title slug issuer category level previewImage skills visibleToSegments'),
    BlogPostModel.find({ $or: [{ title: regex }, { excerpt: regex }, { tags: regex }] })
      .limit(limit)
      .select('title slug excerpt tags categories coverImage published publishedAt readTime visibleToSegments')
  ]);

  const results: Array<SearchResult<unknown>> = [
    {
      type: 'project',
      items: projects.map((project) => {
        const access = buildAccessDescriptor({
          visibleToSegments: project.visibleToSegments,
          viewerSegment: context.viewerSegment,
          isAdminBypass: context.isAdminBypass
        });

        return {
          id: project._id.toString(),
          title: project.title,
          slug: project.slug,
          description: project.description,
          category: project.category,
          level: project.level,
          technologies: access.locked ? [] : project.technologies,
          heroImage: project.heroImage,
          featured: Boolean(project.featured),
          visibleToSegments: normalizeVisibleToSegments(project.visibleToSegments),
          access
        };
      })
    },
    {
      type: 'certificate',
      items: certificates.map((certificate) => {
        const access = buildAccessDescriptor({
          visibleToSegments: certificate.visibleToSegments,
          viewerSegment: context.viewerSegment,
          isAdminBypass: context.isAdminBypass
        });

        return {
          id: certificate._id.toString(),
          title: certificate.title,
          slug: certificate.slug,
          issuer: certificate.issuer,
          category: certificate.category,
          level: certificate.level,
          previewImage: certificate.previewImage,
          skills: access.locked ? [] : certificate.skills,
          visibleToSegments: normalizeVisibleToSegments(certificate.visibleToSegments),
          access
        };
      })
    },
    {
      type: 'blog',
      items: posts.map((post) => {
        const access = buildAccessDescriptor({
          visibleToSegments: post.visibleToSegments,
          viewerSegment: context.viewerSegment,
          isAdminBypass: context.isAdminBypass
        });

        return {
          id: post._id.toString(),
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          tags: post.tags,
          categories: post.categories,
          coverImage: post.coverImage,
          published: post.published,
          publishedAt: post.publishedAt,
          readTime: post.readTime,
          visibleToSegments: normalizeVisibleToSegments(post.visibleToSegments),
          access
        };
      })
    }
  ];

  return {
    term,
    results
  };
};
