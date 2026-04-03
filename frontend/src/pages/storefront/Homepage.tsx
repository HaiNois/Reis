import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  homepageSectionApi,
  feedbackApi,
  HomepageSection,
  ProductImage as HomepageProductImage,
} from "@/services/homepageApi";
import { productApi } from "@/services/productApi";
import { FALLBACK_IMAGE } from "@/services/productApi";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Spinner } from "@/components/ui/spinner";

// Helper to get main image URL from various formats
function getProductImageUrl(images: HomepageProductImage[] | undefined): string {
  if (!images || images.length === 0) return FALLBACK_IMAGE

  // Sort by position (legacy format)
  const sorted = [...images].sort((a, b) => a.position - b.position)
  const mainImage = sorted[0]

  // Support both legacy (url) and new format (publicUrl)
  return mainImage?.url || mainImage?.publicUrl || FALLBACK_IMAGE
}

// ==================== SECTION RENDERERS ====================

// Announcement Bar
function AnnouncementBarSection({ section }: { section: HomepageSection }) {
  const announcements =
    section.items?.filter((i) => i.itemType === "ANNOUNCEMENT") || [];

  if (announcements.length === 0) return null;

  return (
    <div className="bg-black text-white text-center py-2 overflow-hidden">
      <div className="flex justify-center items-center gap-4">
        {announcements.map((item) => (
          <Link
            key={item.id}
            to={item.ctaUrl || "#"}
            target={item.linkTarget === "BLANK" ? "_blank" : "_self"}
            className="hover:underline text-sm"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Hero Section
function HeroSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "vi";
  const title = section.title;
  const subtitle = section.subtitle;
  const config = section.configJson as
    | { overlayStyle?: string; textAlign?: string }
    | undefined;

  // Find hero item if exists
  const heroItem = section.items?.[0];
  const imageUrl = "/images/banners/banner.jpg";
  const mobileImageUrl = heroItem?.mobileMediaUrl || imageUrl;
  const ctaLabel =
    heroItem?.ctaLabel || (lang === "en" ? "Shop Now" : "Mua ngay");
  const ctaUrl = heroItem?.ctaUrl || "/products";

  const textAlign = config?.textAlign || "center";
  const overlayStyle = config?.overlayStyle || "dark";

  return (
    <section className="relative bg-gray-100">
      <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-[25/9] max-h-[700px]">
        <picture>
          <source media="(max-width: 768px)" srcSet={mobileImageUrl} />
          <img
            src={imageUrl}
            alt={title || "Hero"}
            className="w-full h-full object-cover"
          />
        </picture>
        <div
          className={`absolute inset-0 ${overlayStyle === "light" ? "bg-white/20" : "bg-black/30"}`}
        >
          <div
            className={`container-custom h-full flex flex-col justify-center ${textAlign === "left" ? "items-start text-left" : textAlign === "right" ? "items-end text-right" : "items-center text-center"}`}
          >
            {subtitle && (
              <p
                className={`text-white/80 mb-4 text-lg md:text-xl ${textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : "text-center"}`}
              >
                {subtitle}
              </p>
            )}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-wide mb-4 text-white">
              {title}
            </h1>
            <Link
              to={ctaUrl}
              className="mt-6 px-8 py-3 bg-white text-black font-medium tracking-wide hover:bg-black hover:text-white transition-colors duration-300"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Product Rail
function ProductRailSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "vi";
  const title = section.title;
  const subtitle = section.subtitle;

  const products = section.products?.map((sp) => sp.product) || [];

  return (
    <section className="py-8 md:py-12 border-t">
      <div className="container-custom">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
                {title || (lang === "en" ? "Products" : "Sản phẩm")}
              </h2>
              {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/products"
                className="text-sm font-medium tracking-wide hover:text-gray-600 transition-colors"
              >
                {lang === "en" ? "View collection" : "Xem thêm"}
              </Link>
              <div className="flex gap-2">
                <CarouselPrevious className="static translate-y-0 left-0" />
                <CarouselNext className="static translate-y-0 right-0" />
              </div>
            </div>
          </div>
          <CarouselContent className="-ml-4">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <Link
                  to={`/products/${product.slug}`}
                  className="product-card group block"
                >
                  <div className="product-card__image aspect-[3/4]">
                    <img
                      src={getProductImageUrl(product.images)}
                      alt={
                        lang === "en" && product.nameEn
                          ? product.nameEn
                          : product.name
                      }
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="product-card__info">
                    <h3 className="product-card__title group-hover:text-gray-600 transition-colors">
                      {lang === "en" && product.nameEn
                        ? product.nameEn
                        : product.name}
                    </h3>
                    <p className="product-card__price">
                      {Number(product.price).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

// Media Tiles
function MediaTilesSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "vi";
  const title = section.title;
  const config = section.configJson as { collectionId?: string } | undefined;
  const collectionId = config?.collectionId;

  const items = section.items?.filter((i) => i.itemType === "MEDIA_TILE") || [];

  // If collectionId is set, show products from that collection instead of items
  const [collectionProducts, setCollectionProducts] = useState<any[]>([]);

  useEffect(() => {
    if (collectionId) {
      productApi.getCollectionProducts(collectionId).then((res) => {
        setCollectionProducts(res.data || []);
      }).catch(() => setCollectionProducts([]));
    }
  }, [collectionId]);

  const displayProducts = collectionProducts.length > 0 ? collectionProducts : [];

  return (
    <section className="py-8 md:py-12">
      <div className="container-custom">
        {displayProducts.length > 0 ? (
          // Show products from collection
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            {title && (
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
                  {title}
                </h2>
                <div className="flex items-center gap-4">
                  <Link
                    to="/collections"
                    className="text-sm font-medium tracking-wide hover:text-gray-600 transition-colors"
                  >
                    {lang === "en" ? "View all" : "Xem tất cả"}
                  </Link>
                  <div className="flex gap-2">
                    <CarouselPrevious className="static translate-y-0 left-0" />
                    <CarouselNext className="static translate-y-0 right-0" />
                  </div>
                </div>
              </div>
            )}
            <CarouselContent className="-ml-4">
              {displayProducts.map((product: any) => (
                <CarouselItem
                  key={product.id}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <Link
                    to={`/products/${product.slug}`}
                    className="product-card group block"
                  >
                    <div className="product-card__image aspect-[3/4] overflow-hidden">
                      <img
                        src={getProductImageUrl(product.images)}
                        alt={lang === "en" && product.nameEn ? product.nameEn : product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="product-card__info">
                      <h3 className="product-card__title group-hover:text-gray-600 transition-colors">
                        {lang === "en" && product.nameEn ? product.nameEn : product.name}
                      </h3>
                      <p className="product-card__price">
                        {Number(product.price).toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="static translate-y-0 left-0" />
            <CarouselNext className="static translate-y-0 right-0" />
          </Carousel>
        ) : (
          // Fallback to items (original behavior)
          items.length > 0 && (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              {title && (
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
                    {title}
                  </h2>
                  <div className="flex items-center gap-4">
                    <Link
                      to="/products"
                      className="text-sm font-medium tracking-wide hover:text-gray-600 transition-colors"
                    >
                      {lang === "en" ? "View all" : "Xem tất cả"}
                    </Link>
                    <div className="flex gap-2">
                      <CarouselPrevious className="static translate-y-0 left-0" />
                      <CarouselNext className="static translate-y-0 right-0" />
                    </div>
                  </div>
                </div>
              )}

              <CarouselContent className="-ml-4">
                {items.map((item) => {
                  const itemConfig = item.metaJson as
                    | { overlayStyle?: string }
                    | undefined;
                  return (
                    <CarouselItem
                      key={item.id}
                      className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                    >
                      <Link
                        to={item.ctaUrl || "#"}
                        target={item.linkTarget === "BLANK" ? "_blank" : "_self"}
                        className="block group relative overflow-hidden aspect-[4/5]"
                      >
                        <img
                          src={item.mediaUrl || "/images/products/placeholder.jpg"}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div
                          className={`absolute inset-0 ${itemConfig?.overlayStyle === "light" ? "bg-white/20" : "bg-black/30"} flex flex-col justify-end p-6`}
                        >
                          {item.title && (
                            <h3 className="text-white text-xl font-bold">
                              {item.title}
                            </h3>
                          )}
                          {item.subtitle && (
                            <p className="text-white/80 text-sm">{item.subtitle}</p>
                          )}
                          {item.ctaLabel && (
                            <span className="text-white text-sm mt-2 underline">
                              {item.ctaLabel}
                            </span>
                          )}
                        </div>
                      </Link>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2" />
            </Carousel>
          )
        )}
      </div>
    </section>
  );
}

// Section Renderer
function SectionRenderer({ section }: { section: HomepageSection }) {
  switch (section.sectionType) {
    case "ANNOUNCEMENT_BAR":
      return <AnnouncementBarSection key={section.id} section={section} />;
    case "HERO":
      return <HeroSection key={section.id} section={section} />;
    case "PRODUCT_RAIL":
      return <ProductRailSection key={section.id} section={section} />;
    case "MEDIA_TILES":
      return <MediaTilesSection key={section.id} section={section} />;
    default:
      return null;
  }
}

// ==================== FEEDBACK SECTION ====================

function FeedbackSection({ feedback }: { feedback: any[] }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "vi";

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide text-center mb-12">
          {lang === "en" ? "Customer Reviews" : "Đánh Giá Khách Hàng"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feedback.map((fb: any) => (
            <div key={fb.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {fb.avatarUrl ? (
                    <img
                      src={fb.avatarUrl}
                      alt={fb.customerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-500">
                      {fb.customerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{fb.customerName}</h4>
                  {fb.customerRole && (
                    <p className="text-sm text-gray-500">{fb.customerRole}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= fb.rating ? "text-yellow-400" : "text-gray-300"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-600">{fb.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== MAIN HOMEPAGE ====================

export default function Homepage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(
    [],
  );
  const [feedback, setFeedback] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, feedbackRes] = await Promise.all([
          homepageSectionApi.getActiveHomepage().catch(() => ({ data: [] })),
          feedbackApi.getFeaturedFeedback().catch(() => ({ data: [] })),
        ]);

        setHomepageSections(sectionsRes.data || []);
        setFeedback(feedbackRes.data || []);
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    );
  }

  return (
    <div>
      {/* Dynamic Homepage Sections */}
      {homepageSections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}

      {/* Feedback */}
      {feedback.length > 0 && <FeedbackSection feedback={feedback} />}

      {/* Banner Section */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/collections" className="block group">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src="/images/products/621561089_17959227669044199_2769149982932536652_n.jpg"
                  alt={t("home.women")}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                  {t("home.women")}
                </h3>
              </div>
            </Link>
            <Link to="/collections" className="block group">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src="/images/products/621788664_17959227642044199_6141261247981617575_n.jpg"
                  alt={t("home.accessories")}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                  {t("home.accessories")}
                </h3>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
