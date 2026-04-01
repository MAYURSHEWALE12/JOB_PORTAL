import java.nio.file.*;

public class PathCheck {
    public static void main(String[] args) {
        Path p = Paths.get("uploads/resumes");
        System.out.println("Absolute path: " + p.toAbsolutePath());
        System.out.println("Exists: " + Files.exists(p));
        System.out.println("Is Writable: " + Files.isWritable(p));
    }
}
