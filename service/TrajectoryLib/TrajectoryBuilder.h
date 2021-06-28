#ifndef _TRAJECTORY_BUILDER_H_
#define _TRAJECTORY_BUILDER_H_
#include<vector>
#include<cmath>
#define MIN_DOUBLE_VALUE (0.0000001)
#define IS_DOUBLE_ZERO(x) (fabs((x))<=MIN_DOUBLE_VALUE)

#ifndef M_PI
#define M_PI           3.14159265358979323846  /* pi */
#endif

class Vec2
{
public:
    double x;
    double y;
    Vec2();
    Vec2(double xx, double yy);
    Vec2(const Vec2& v);
    inline Vec2 operator+(const Vec2& v) const;
    double distance(const Vec2& v) const;
    inline Vec2 operator*(double s) const;
    inline Vec2 operator/(double s) const;
};
inline Vec2 operator*(double x, const Vec2& v);

struct TrajectoryPoint
{
    Vec2 pos;
    double heading;
};
enum TrajectoryType
{
    CLOTHOID,//回旋曲线
    BEZIER, //贝塞尔曲线
};

class TrajectoryBuilder
{
public:
    TrajectoryBuilder();
    ~TrajectoryBuilder();
    std::vector<std::vector<Vec2>> getAllTrajectoryPoints(std::vector<TrajectoryPoint> trajectoryPoints);
    void setType(TrajectoryType type){_type = type;};
private:
    std::vector<std::vector<Vec2>> getClothoidPoints(std::vector<TrajectoryPoint> trajectoryPoints);
    std::vector<std::vector<Vec2>> getBezierPoints(std::vector<TrajectoryPoint> trajectoryPoints);
    std::vector<std::vector<Vec2>> getCubicBezierPoints(std::vector<TrajectoryPoint> trajectoryPoints);

    TrajectoryType _type;
};

class PathSegment {
public:
    PathSegment(){
    }
    PathSegment(std::vector<TrajectoryPoint>& path_, double lengthOfPath_) : path(path_), lengthOfPath(lengthOfPath_) {
    }
    std::vector<TrajectoryPoint> path;
    double lengthOfPath;
    double sigma;
};
/*
class Clothoid
{
public:
    Clothoid();
    int kMax;
    int solution;
    // std::vector<ClothoidPathSegment> paths;
    void getPath(TrajectoryPoint start, TrajectoryPoint end, std::vector<Vec2>&resultPoints, int reserve);
    std::vector<Vec2> getPathPoints();

private:
    int fresnel(double x, double &costerm, double &sinterm);
    void getXY(double s, double a, double b, double c, double &x, double &y);
    void getTrajectory();
    int signum(double a);
    double calcD(double alpha);
    double inRange(double theta);

    PathSegment path;
    TrajectoryPoint start, end;
};
*/
#endif
