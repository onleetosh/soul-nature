from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Category, Product


CATEGORIES = [
    {
        "name": "Grooming",
        "slug": "grooming",
        "description": "Natural essentials for beard care and daily grooming.",
    },
    {
        "name": "Fragrance",
        "slug": "fragrance",
        "description": "Considered scents inspired by the richness of nature.",
    },
    {
        "name": "Wellness",
        "slug": "wellness",
        "description": "Small rituals to bring more intention to your day.",
    },
]

PRODUCTS = [
    {
        "sku": "SON-GRM-001",
        "name": "Nourishing Beard Oil",
        "slug": "nourishing-beard-oil",
        "description": "A lightweight botanical oil for a softer beard and a calmer daily ritual.",
        "price_cents": 2400,
        "image_url": "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 40,
        "category_slug": "grooming",
    },
    {
        "sku": "SON-GRM-002",
        "name": "Daily Beard Balm",
        "slug": "daily-beard-balm",
        "description": "A nourishing balm to keep your beard feeling cared for and naturally in place.",
        "price_cents": 2200,
        "image_url": "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 32,
        "category_slug": "grooming",
    },
    {
        "sku": "SON-GRM-003",
        "name": "Grounding Body Wash",
        "slug": "grounding-body-wash",
        "description": "A refreshing daily cleanse with a warm, woodsy scent.",
        "price_cents": 1800,
        "image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 36,
        "category_slug": "grooming",
    },
    {
        "sku": "SON-FRG-001",
        "name": "Stillwood Eau de Parfum",
        "slug": "stillwood-eau-de-parfum",
        "description": "A grounding fragrance with soft woods, fresh greens, and a quiet warmth.",
        "price_cents": 6800,
        "image_url": "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 18,
        "category_slug": "fragrance",
    },
    {
        "sku": "SON-FRG-002",
        "name": "Open Air Fragrance Oil",
        "slug": "open-air-fragrance-oil",
        "description": "A close-to-the-skin scent inspired by fresh air after the rain.",
        "price_cents": 3400,
        "image_url": "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 24,
        "category_slug": "fragrance",
    },
    {
        "sku": "SON-FRG-003",
        "name": "Cedar & Moss Discovery Set",
        "slug": "cedar-moss-discovery-set",
        "description": "Three small-batch scents to find the notes that feel like you.",
        "price_cents": 2800,
        "image_url": "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 30,
        "category_slug": "fragrance",
    },
    {
        "sku": "SON-WEL-001",
        "name": "Restore Bath Soak",
        "slug": "restore-bath-soak",
        "description": "A mineral-rich soak for slowing down and settling into the moment.",
        "price_cents": 2600,
        "image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 26,
        "category_slug": "wellness",
    },
    {
        "sku": "SON-WEL-002",
        "name": "Unwind Botanical Candle",
        "slug": "unwind-botanical-candle",
        "description": "A hand-poured candle with a gentle botanical scent for winding down.",
        "price_cents": 3200,
        "image_url": "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 20,
        "category_slug": "wellness",
    },
    {
        "sku": "SON-WEL-003",
        "name": "Everyday Hand & Body Balm",
        "slug": "everyday-hand-body-balm",
        "description": "An everyday moisturizer for hands and body, made for an unhurried moment.",
        "price_cents": 2000,
        "image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
        "stock_quantity": 34,
        "category_slug": "wellness",
    },
]


def seed_database() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        categories_by_slug: dict[str, Category] = {}
        for category_data in CATEGORIES:
            category = session.scalar(
                select(Category).where(Category.slug == category_data["slug"])
            )
            if category is None:
                category = Category(**category_data)
                session.add(category)
            categories_by_slug[category_data["slug"]] = category

        session.flush()

        for product_data in PRODUCTS:
            product = session.scalar(
                select(Product).where(Product.sku == product_data["sku"])
            )
            if product is not None:
                continue

            category_slug = product_data["category_slug"]
            product_values = {
                key: value
                for key, value in product_data.items()
                if key != "category_slug"
            }
            session.add(
                Product(
                    **product_values,
                    category_id=categories_by_slug[category_slug].id,
                )
            )

        session.commit()


if __name__ == "__main__":
    seed_database()
    print(f"Seeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products.")
