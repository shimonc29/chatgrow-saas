import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSourceTracking, buildSourceKey, storeSourceTracking } from '../../utils/sourceTracking';

const LandingPageViewer = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [linkedEntity, setLinkedEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPage();
    // Capture and store source tracking when page loads
    const tracking = getSourceTracking();
    // Add sourceKey for this landing page if not already set
    if (!tracking.sourceKey) {
      tracking.sourceKey = buildSourceKey('landing-page', slug);
    }
    storeSourceTracking(tracking);
  }, [slug]);

  const fetchPage = async () => {
    try {
      const response = await axios.get(`/api/public/landing/${slug}`);
      setPage(response.data.page);
      setLinkedEntity(response.data.linkedEntity);
    } catch (err) {
      console.error(err);
      setError('דף לא נמצא');
    } finally {
      setLoading(false);
    }
  };

  const handleCTA = async () => {
    try {
      // Track conversion with source tracking
      const tracking = getSourceTracking();
      await axios.post(`/api/public/landing/${slug}/convert`, tracking);

      // Navigate to registration page if linked (source tracking preserved in sessionStorage)
      if (page.linkedTo?.type === 'event' && page.linkedTo.id) {
        navigate(`/events/${page.linkedTo.id}/register`);
      } else if (page.linkedTo?.type === 'appointment') {
        navigate(`/appointments/book`);
      }
    } catch (err) {
      console.error('Error tracking conversion:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
        <div className="text-xl sm:text-2xl text-yellow-400 relative z-10">טוען...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
        <div className="text-center relative z-10">
          <div className="text-4xl sm:text-6xl mb-4">❌</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">דף לא נמצא</h1>
          <p className="text-sm sm:text-base text-gray-300">הדף שחיפשת אינו קיים או שהוסר</p>
        </div>
      </div>
    );
  }

  const { content, styling } = page;

  return (
    <div 
      dir="rtl" 
      className="min-h-screen"
      style={{ 
        backgroundColor: styling.backgroundColor,
        fontFamily: styling.fontFamily + ', sans-serif'
      }}
    >
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-16 sm:py-20"
        style={{
          backgroundImage: content.hero.image ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${content.hero.image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: content.hero.image ? 'transparent' : styling.primaryColor + '15'
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6"
            style={{ 
              color: content.hero.image ? '#FFFFFF' : styling.primaryColor,
              textShadow: content.hero.image ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {content.hero.headline}
          </h1>
          
          <p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10"
            style={{ 
              color: content.hero.image ? '#FFFFFF' : styling.secondaryColor,
              textShadow: content.hero.image ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {content.hero.subheadline}
          </p>

          <button
            onClick={handleCTA}
            className="text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg md:text-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
            style={{ backgroundColor: content.hero.ctaColor }}
          >
            {content.hero.ctaText}
          </button>

          {linkedEntity && (
            <div className="mt-8 sm:mt-10 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 inline-block shadow-xl max-w-md w-full">
              <div className="flex items-center space-x-reverse space-x-3 sm:space-x-4">
                <div className="text-3xl sm:text-4xl flex-shrink-0">
                  {page.linkedTo.type === 'event' ? '📅' : '📋'}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800 text-base sm:text-lg">
                    {linkedEntity.title || linkedEntity.serviceName}
                  </div>
                  {linkedEntity.date && (
                    <div className="text-gray-600">
                      📅 {new Date(linkedEntity.date).toLocaleDateString('he-IL')}
                    </div>
                  )}
                  {linkedEntity.price && (
                    <div className="text-brand-600 font-bold">
                      💰 ₪{linkedEntity.price}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      {content.about?.title && (
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
              {content.about.image && (
                <div className="order-2 md:order-1">
                  <img 
                    src={content.about.image} 
                    alt={content.about.title}
                    className="rounded-2xl shadow-2xl w-full"
                  />
                </div>
              )}
              <div className={`order-1 ${content.about.image ? 'md:order-2' : 'md:col-span-2 text-center'}`}>
                <h2 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6"
                  style={{ color: styling.primaryColor }}
                >
                  {content.about.title}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                  {content.about.description}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {content.features && content.features.length > 0 && content.features[0].title && (
        <section 
          className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8"
          style={{ backgroundColor: styling.primaryColor + '08' }}
        >
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16"
              style={{ color: styling.primaryColor }}
            >
              למה לבחור בנו?
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {content.features.map((feature, index) => (
                feature.title && (
                  <div 
                    key={index}
                    className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-lg hover:shadow-2xl transition-shadow"
                  >
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">{feature.icon}</div>
                    <h3 
                      className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3"
                      style={{ color: styling.primaryColor }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {content.testimonials && content.testimonials.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-4xl font-bold text-center mb-16"
              style={{ color: styling.primaryColor }}
            >
              מה אומרים עלינו
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {content.testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg"
                >
                  <div className="flex items-center mb-4">
                    {testimonial.avatar ? (
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full ml-4"
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-full ml-4 flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: styling.primaryColor }}
                      >
                        {testimonial.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-800">{testimonial.name}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section 
        className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8"
        style={{ backgroundColor: styling.primaryColor }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            מוכנים להתחיל?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white mb-8 sm:mb-10 opacity-90">
            הצטרפו אלינו עוד היום וחוו את ההבדל!
          </p>
          <button
            onClick={handleCTA}
            className="bg-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg md:text-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
            style={{ color: styling.primaryColor }}
          >
            {content.hero.ctaText}
          </button>
        </div>
      </section>

      {/* Footer */}
      {content.footer?.text && (
        <footer className="bg-gray-900 text-white py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm sm:text-base text-gray-400">{content.footer.text}</p>
            
            {content.footer.links && content.footer.links.length > 0 && (
              <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-4 sm:gap-6">
                {content.footer.links.map((link, index) => (
                  <a 
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

export default LandingPageViewer;
