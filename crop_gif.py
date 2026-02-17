from PIL import Image
import os

def crop_animated_gif_bottom(image_path):
    try:
        # Load the original GIF
        img = Image.open(image_path)
        
        frames = []
        try:
            while True:
                # Copy current frame
                frame = img.copy()
                frame = frame.convert("RGBA")
                
                # We need to crop to the content.
                # However, for animated GIFs, we should probably calculate the crop box based on ALL frames
                # so the character doesn't jump around if its position changes slightly.
                # Or maybe the user just wants the empty space below removed consistently.
                
                # Let's first analyze the bounding box of all frames combined to find the max content area.
                # But "below" implies we just want to cut off empty bottomrows.
                
                frames.append(frame)
                img.seek(img.tell() + 1)
        except EOFError:
            pass

        if not frames:
            print("No frames found.")
            return

        # Find the global bounding box
        left_min, top_min, right_max, bottom_max = frames[0].size[0], frames[0].size[1], 0, 0
        
        # Actually, let's find the crop box for the first frame and see if it applies?
        # A safer bet for "remove transparent bottom" is to find the lowest non-transparent pixel across ALL frames.
        
        min_x = frames[0].width
        min_y = frames[0].height
        max_x = 0
        max_y = 0
        
        print(f"Analyzing {len(frames)} frames...")
        
        for frame in frames:
            bbox = frame.getbbox()
            if bbox:
                min_x = min(min_x, bbox[0])
                min_y = min(min_y, bbox[1])
                max_x = max(max_x, bbox[2])
                max_y = max(max_y, bbox[3])
        
        # Now we have a bbox that contains all movement.
        # Crop all frames to this bbox.
        
        # However, checking if the user wants to keep horizontal centering?
        # Usually for game assets, trimming transparent space is good.
        # Let's crop to (0, 0, width, max_y) if we only want to crop bottom.
        # But `getbbox` gives tight fit.
        # User said "bottom has transparent part", maybe side too?
        # Let's stick to the tightest box that contains all frames' content.
        
        final_box = (0, 0, frames[0].width, max_y) # Crop only from bottom up to content
        # Wait, getbbox returns (left, upper, right, lower).
        # lowering the bottom edge to max_y removes the empty space at the bottom.
        
        print(f"Original Size: {frames[0].size}")
        print(f"Crop Box (Global Content): {final_box}")
        
        cropped_frames = []
        for frame in frames:
            cropped = frame.crop(final_box)
            cropped_frames.append(cropped)
            
        # Save as animated GIF
        # duration is per frame. We need to get it from original.
        duration = img.info.get('duration', 100)
        loop = img.info.get('loop', 0)
        
        cropped_frames[0].save(
            image_path,
            save_all=True,
            append_images=cropped_frames[1:],
            optimize=False,
            duration=duration,
            loop=loop,
            disposal=2 # Restore to background color (2) matches most GIFs transparency handling
        )
        
        print(f"Successfully cropped animated GIF: {image_path}")
        print(f"New size: {cropped_frames[0].size}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    target_file = "/Users/winnie.lin/DreamScape/src/assets/images/portal.gif"
    if os.path.exists(target_file):
        crop_animated_gif_bottom(target_file)
    else:
        print(f"File not found: {target_file}")
