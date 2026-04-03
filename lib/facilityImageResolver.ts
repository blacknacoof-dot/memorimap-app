type FacilityImageSource = {
    image_url?: string | null;
    images?: string[] | null;
};

type ResolveFacilityDetailImagesOptions = {
    signImage: (value: string) => Promise<string>;
};

export type ResolvedFacilityImages = {
    imageUrl: string;
    galleryImages: string[];
};

async function safeSignImage(
    value: string,
    signImage: (value: string) => Promise<string>,
): Promise<string> {
    try {
        return await signImage(value);
    } catch {
        return value;
    }
}

export async function resolveFacilityDetailImages(
    source: FacilityImageSource,
    options: ResolveFacilityDetailImagesOptions,
): Promise<ResolvedFacilityImages> {
    const rawMainImage = typeof source.image_url === 'string' ? source.image_url.trim() : '';
    const rawGalleryImages = Array.isArray(source.images)
        ? source.images.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        : [];

    const [imageUrl, galleryImages] = await Promise.all([
        rawMainImage ? safeSignImage(rawMainImage, options.signImage) : Promise.resolve(''),
        Promise.all(rawGalleryImages.map((value) => safeSignImage(value, options.signImage))),
    ]);

    return {
        imageUrl: imageUrl || galleryImages[0] || '',
        galleryImages,
    };
}
