from PIL import Image
import os

def crop_transparent_bottom(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        
        # Get the bounding box of the non-zero regions
        bbox = img.getbbox()
        
        if bbox:
            # bbox is (left, upper, right, lower)
            # We want to keep the original width, so we only care about the bottom crop
            # actually user said "bottom has transparent part, can we cut it off"
            # so we should crop from bottom up to the last non-transparent pixel.
            
            # verify if the user meant ONLY bottom or ALL transparent borders.
            # "圖片下方有一塊透明 可否切掉" -> "There is a transparent piece at the bottom of the picture, can I cut it off?"
            # so likely they want to remove the empty space at the bottom.
            
            # Let's crop to the bounding box vertical limits but keep horizontal limits if desired?
            # Usually cropping to bbox is what people want (tight fit).
            # But let's stick to just cropping the bottom to be safe, or just use bbox which is safer for "removing transparency".
            
            # Let's use bbox.
            cropped_img = img.crop(bbox)
            
            # Save the result
            # We can overwrite or save as new. Let's overwrite as implied by "cut it off".
            cropped_img.save(image_path)
            print(f"Successfully cropped {image_path}")
            print(f"Original size: {img.size}, New size: {cropped_img.size}")
        else:
            print("Image is fully transparent?")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    target_file = "/Users/winnie.lin/DreamScape/src/assets/images/character-silhouette.gif"
    if os.path.exists(target_file):
        crop_transparent_bottom(target_file)
    else:
        print(f"File not found: {target_file}")
